import express from "express";
import cors from "cors";
import OSS from "ali-oss";
import path from "path";
import { fileURLToPath } from "url";
import mime from "mime-types";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createOssClient(config) {
  const { region, accessKeyId, accessKeySecret, bucket, endpoint, secure, timeout } = config;
  const clientConfig = {
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
    secure: secure !== false,
    timeout: timeout || "60000",
  };

  if (endpoint) {
    clientConfig.endpoint = endpoint;
  }

  return new OSS(clientConfig);
}

function sanitizeSegment(input) {
  return String(input || "")
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildBaseDir({ mode, customDir }) {
  const date = new Date();
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const day = `${y}${m}${d}`;
  const hms = `${hh}${mm}${ss}`;

  if (mode === "custom") {
    return sanitizeSegment(customDir) || "uploads";
  }

  if (mode === "time_nested") {
    return `media_${day}/${hms}`;
  }

  return `media_${day}_${hms}`;
}

async function fetchBinaryFromUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (media-replacer)",
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      throw new Error(`下载失败: HTTP ${res.status}`);
    }

    const arr = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return {
      buffer: Buffer.from(arr),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseDataUrl(dataUrl) {
  const m = String(dataUrl).match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
  if (!m) {
    throw new Error("非法 data URL");
  }
  const contentType = m[1] || "application/octet-stream";
  const isBase64 = Boolean(m[2]);
  const data = m[3] || "";

  const buffer = isBase64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8");

  return { buffer, contentType };
}

function buildFileName(index, contentType, originalUrl) {
  const extByMime = mime.extension(contentType || "") || "";
  let ext = extByMime;

  if (!ext && originalUrl) {
    try {
      const pathname = new URL(originalUrl).pathname;
      const dot = pathname.lastIndexOf(".");
      if (dot > -1) {
        ext = pathname.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
      }
    } catch {
      // ignore
    }
  }

  if (!ext) {
    ext = "bin";
  }

  const ts = Date.now();
  return `media-${String(index + 1).padStart(3, "0")}-${ts}.${ext}`;
}

app.post("/api/oss/test", async (req, res) => {
  try {
    const client = createOssClient(req.body || {});
    const result = await client.listV2({ "max-keys": 1 });
    return res.json({
      ok: true,
      message: "连接成功",
      bucket: client.options.bucket,
      region: client.options.region,
      objectCountSample: result.objects?.length || 0,
    });
  } catch (err) {
    return res.status(400).json({ ok: false, message: err.message || "连接失败" });
  }
});

app.post("/api/media/replace", async (req, res) => {
  const {
    ossConfig,
    mediaItems,
    rawText,
    folderMode = "time_flat",
    customDir,
  } = req.body || {};

  if (!ossConfig || !Array.isArray(mediaItems)) {
    return res.status(400).json({ ok: false, message: "参数不完整" });
  }

  try {
    const client = createOssClient(ossConfig);
    const baseDir = buildBaseDir({ mode: folderMode, customDir });

    const uploads = [];
    let replacedText = String(rawText || "");

    for (let i = 0; i < mediaItems.length; i += 1) {
      const item = mediaItems[i];
      const marker = item.marker;
      let payload;

      try {
        if (item.sourceType === "dataUrl") {
          payload = parseDataUrl(item.src);
        } else {
          payload = await fetchBinaryFromUrl(item.src);
        }

        const fileName = buildFileName(i, payload.contentType, item.src);
        const objectKey = `${baseDir}/${fileName}`;

        const putRes = await client.put(objectKey, payload.buffer, {
          headers: {
            "Content-Type": payload.contentType,
            "Cache-Control": "public, max-age=31536000",
          },
        });

        const finalUrl = putRes.url;
        uploads.push({
          index: i,
          marker,
          oldSrc: item.src,
          newSrc: finalUrl,
          status: "success",
          objectKey,
        });

        if (marker && finalUrl) {
          replacedText = replacedText.split(marker).join(finalUrl);
        }
      } catch (err) {
        uploads.push({
          index: i,
          marker,
          oldSrc: item.src,
          status: "failed",
          error: err.message || "上传失败",
        });
      }
    }

    return res.json({
      ok: true,
      baseDir,
      uploads,
      replacedText,
      successCount: uploads.filter((x) => x.status === "success").length,
      failedCount: uploads.filter((x) => x.status === "failed").length,
      total: uploads.length,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || "处理失败" });
  }
});

app.post("/api/media/upload-one", async (req, res) => {
  const {
    ossConfig,
    item,
    index = 0,
    folderMode = "time_flat",
    customDir,
  } = req.body || {};

  if (!ossConfig || !item || !item.src) {
    return res.status(400).json({ ok: false, message: "参数不完整" });
  }

  try {
    const client = createOssClient(ossConfig);
    const baseDir = buildBaseDir({ mode: folderMode, customDir });
    const payload = item.sourceType === "dataUrl"
      ? parseDataUrl(item.src)
      : await fetchBinaryFromUrl(item.src);

    const fileName = buildFileName(index, payload.contentType, item.src);
    const objectKey = `${baseDir}/${fileName}`;
    const putRes = await client.put(objectKey, payload.buffer, {
      headers: {
        "Content-Type": payload.contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });

    return res.json({
      ok: true,
      upload: {
        index,
        marker: item.marker,
        oldSrc: item.src,
        newSrc: putRes.url,
        status: "success",
        objectKey,
      },
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: err.message || "上传失败",
      upload: {
        index,
        marker: item.marker,
        oldSrc: item.src,
        status: "failed",
        error: err.message || "上传失败",
      },
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
