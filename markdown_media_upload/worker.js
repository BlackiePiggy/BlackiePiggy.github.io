import mime from "mime-types";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function parseEndpoint(config) {
  const secure = config?.secure !== false;
  const protocol = secure ? "https:" : "http:";
  const bucket = String(config?.bucket || "").trim();
  const region = String(config?.region || "").trim();
  const endpointRaw = String(config?.endpoint || "").trim();

  if (endpointRaw) {
    const ep = endpointRaw.includes("://") ? new URL(endpointRaw) : new URL(`${protocol}//${endpointRaw}`);
    return { protocol: ep.protocol || protocol, host: ep.host, bucket };
  }

  if (!bucket || !region) throw new Error("缺少 bucket 或 region");
  return { protocol, host: `${bucket}.${region}.aliyuncs.com`, bucket };
}

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function ossSign(method, contentType, date, canonicalResource, accessKeySecret) {
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalResource}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(accessKeySecret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(stringToSign));
  return toBase64(sig);
}

function encodeObjectKey(key) {
  return String(key || "").split("/").map((x) => encodeURIComponent(x)).join("/");
}

async function ossListV2(config) {
  const { accessKeyId, accessKeySecret, bucket } = config || {};
  if (!accessKeyId || !accessKeySecret || !bucket) throw new Error("OSS 配置不完整");
  const ep = parseEndpoint(config);
  const date = new Date().toUTCString();
  const canonicalResource = `/${bucket}/`;
  const signature = await ossSign("GET", "", date, canonicalResource, accessKeySecret);

  const res = await fetch(`${ep.protocol}//${ep.host}/?max-keys=1`, {
    method: "GET",
    headers: { Date: date, Authorization: `OSS ${accessKeyId}:${signature}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OSS 列表失败: HTTP ${res.status} ${txt.slice(0, 120)}`);
  }

  return true;
}

async function ossPutObject(config, objectKey, buffer, contentType) {
  const { accessKeyId, accessKeySecret, bucket } = config || {};
  if (!accessKeyId || !accessKeySecret || !bucket) throw new Error("OSS 配置不完整");
  const ep = parseEndpoint(config);
  const date = new Date().toUTCString();
  const ctype = contentType || "application/octet-stream";
  const canonicalResource = `/${bucket}/${objectKey}`;
  const signature = await ossSign("PUT", ctype, date, canonicalResource, accessKeySecret);

  const res = await fetch(`${ep.protocol}//${ep.host}/${encodeObjectKey(objectKey)}`, {
    method: "PUT",
    headers: {
      Date: date,
      Authorization: `OSS ${accessKeyId}:${signature}`,
      "Content-Type": ctype,
      "Cache-Control": "public, max-age=31536000",
    },
    body: buffer,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OSS 上传失败: HTTP ${res.status} ${txt.slice(0, 120)}`);
  }

  return { url: `${ep.protocol}//${ep.host}/${encodeObjectKey(objectKey)}` };
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

  if (mode === "custom") return sanitizeSegment(customDir) || "uploads";
  if (mode === "time_nested") return `media_${day}/${hms}`;
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

    if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);
    const arr = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arr),
      contentType: res.headers.get("content-type") || "application/octet-stream",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseDataUrl(dataUrl) {
  const m = String(dataUrl).match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
  if (!m) throw new Error("非法 data URL");
  const contentType = m[1] || "application/octet-stream";
  const isBase64 = Boolean(m[2]);
  const data = m[3] || "";
  const buffer = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
  return { buffer, contentType };
}

function buildFileName(index, contentType, originalUrl) {
  const extByMime = mime.extension(contentType || "") || "";
  let ext = extByMime;

  if (!ext && originalUrl) {
    try {
      const pathname = new URL(originalUrl).pathname;
      const dot = pathname.lastIndexOf(".");
      if (dot > -1) ext = pathname.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    } catch {
      // ignore
    }
  }

  if (!ext) ext = "bin";
  return `media-${String(index + 1).padStart(3, "0")}-${Date.now()}.${ext}`;
}

async function handleOssTest(request) {
  try {
    const body = await request.json();
    await ossListV2(body || {});
    return json({
      ok: true,
      message: "连接成功",
      bucket: body?.bucket,
      region: body?.region,
      objectCountSample: 1,
    });
  } catch (err) {
    return json({ ok: false, message: err.message || "连接失败" }, 400);
  }
}

async function handleMediaReplace(request) {
  try {
    const body = await request.json();
    const { ossConfig, mediaItems, rawText, folderMode = "time_flat", customDir } = body || {};

    if (!ossConfig || !Array.isArray(mediaItems)) {
      return json({ ok: false, message: "参数不完整" }, 400);
    }

    const baseDir = buildBaseDir({ mode: folderMode, customDir });
    const uploads = [];
    let replacedText = String(rawText || "");

    for (let i = 0; i < mediaItems.length; i += 1) {
      const item = mediaItems[i];
      try {
        const payload = item.sourceType === "dataUrl" ? parseDataUrl(item.src) : await fetchBinaryFromUrl(item.src);
        const fileName = buildFileName(i, payload.contentType, item.src);
        const objectKey = `${baseDir}/${fileName}`;

        const putRes = await ossPutObject(ossConfig, objectKey, payload.buffer, payload.contentType);

        const finalUrl = putRes.url;
        uploads.push({
          index: i,
          marker: item.marker,
          oldSrc: item.src,
          newSrc: finalUrl,
          status: "success",
          objectKey,
        });

        if (item.marker && finalUrl) {
          replacedText = replacedText.split(item.marker).join(finalUrl);
        }
      } catch (err) {
        uploads.push({
          index: i,
          marker: item.marker,
          oldSrc: item.src,
          status: "failed",
          error: err.message || "上传失败",
        });
      }
    }

    return json({
      ok: true,
      baseDir,
      uploads,
      replacedText,
      successCount: uploads.filter((x) => x.status === "success").length,
      failedCount: uploads.filter((x) => x.status === "failed").length,
      total: uploads.length,
    });
  } catch (err) {
    return json({ ok: false, message: err.message || "处理失败" }, 500);
  }
}

async function handleMediaUploadOne(request) {
  try {
    const body = await request.json();
    const { ossConfig, item, index = 0, folderMode = "time_flat", customDir } = body || {};
    if (!ossConfig || !item || !item.src) {
      return json({ ok: false, message: "参数不完整" }, 400);
    }

    const baseDir = buildBaseDir({ mode: folderMode, customDir });
    const payload = item.sourceType === "dataUrl" ? parseDataUrl(item.src) : await fetchBinaryFromUrl(item.src);
    const fileName = buildFileName(index, payload.contentType, item.src);
    const objectKey = `${baseDir}/${fileName}`;
    const putRes = await ossPutObject(ossConfig, objectKey, payload.buffer, payload.contentType);

    return json({
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
    return json({
      ok: false,
      upload: {
        status: "failed",
        error: err.message || "上传失败",
      },
      message: err.message || "上传失败",
    }, 400);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    if (url.pathname === "/api/oss/test" && request.method === "POST") return handleOssTest(request);
    if (url.pathname === "/api/media/replace" && request.method === "POST") return handleMediaReplace(request);
    if (url.pathname === "/api/media/upload-one" && request.method === "POST") return handleMediaUploadOne(request);

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not Found", { status: 404 });
  },
};
