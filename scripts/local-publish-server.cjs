const http = require("http");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const PORT = Number(process.env.LOCAL_PUBLISH_PORT || 8788);
const ROOT = process.cwd();
const PASSWORD = process.env.LOCAL_PUBLISH_PASSWORD || "dev123456";
const CORS_ORIGIN = process.env.LOCAL_PUBLISH_CORS_ORIGIN || "*";
const MEDIA_TOOL_DIR = path.join(ROOT, "markdown_media_upload", "public");
const ARCHETYPES_DIR = path.join(ROOT, "archetypes");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function mediaToolMissingPage() {
  const escapedDir = MEDIA_TOOL_DIR
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Media Upload Tool Missing</title>
  <style>
    body{margin:0;padding:32px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f8fb;color:#16202a}
    .card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #d9e1ea;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.05)}
    h1{margin-top:0}
    code{background:#f1f4f8;padding:2px 6px;border-radius:6px}
    pre{white-space:pre-wrap;background:#0f1720;color:#e6edf3;padding:14px;border-radius:12px;overflow:auto}
  </style>
</head>
<body>
  <div class="card">
    <h1>Media Upload 工具前端资源缺失</h1>
    <p>当前本地 Publisher API 已启动，但内嵌工具依赖的静态文件目录不存在，所以 <code>/media-upload-tool/</code> 无法正常加载。</p>
    <p>期望目录：</p>
    <pre>${escapedDir}</pre>
    <p>这通常说明另一台机器上保留过未提交的 <code>markdown_media_upload/public</code> 文件，而当前工作区里没有这部分资源。</p>
  </div>
</body>
</html>`;
}

function sanitizeSlug(slug) {
  return String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function yamlScalar(v) {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (v === null || v === undefined) return '""';
  const s = String(v);
  if (s === "") return '""';
  if (/^[A-Za-z0-9._/-]+$/.test(s)) return s;
  return JSON.stringify(s);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toIsoWithOffset(value) {
  if (typeof value !== "string") return value;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return value.replace(/(Z|[+-]\d{2}:\d{2})$/, ":00$1").replace(":00Z", ":00+00:00");
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const oh = pad2(Math.floor(Math.abs(offsetMin) / 60));
  const om = pad2(Math.abs(offsetMin) % 60);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${oh}:${om}`;
}

function normalizeDateFields(value, key = "") {
  if (Array.isArray(value)) return value.map((v) => normalizeDateFields(v));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeDateFields(v, k);
    return out;
  }
  if (typeof value === "string" && /(^date$|date$|_at$|^publishDate$)/i.test(key)) {
    return toIsoWithOffset(value);
  }
  return value;
}

function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          const nested = toYaml(item, indent + 2);
          return `${pad}- ${nested.trimStart()}`.replace(/\n/g, `\n${" ".repeat(indent + 2)}`);
        }
        return `${pad}- ${yamlScalar(item)}`;
      })
      .join("\n");
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    return keys
      .map((k) => {
        const v = value[k];
        if (v && typeof v === "object") return `${pad}${k}:\n${toYaml(v, indent + 2)}`;
        return `${pad}${k}: ${yamlScalar(v)}`;
      })
      .join("\n");
  }
  return `${pad}${yamlScalar(value)}`;
}

function buildMarkdown(frontmatter, body) {
  const cleanBody = String(body || "").replace(/<!--more-->/g, "").replace(/^\s+/, "");
  return `---\n${toYaml(frontmatter)}\n---\n\n<!--more-->\n\n${cleanBody}\n`;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function templateFilePath(name) {
  return path.join(ARCHETYPES_DIR, `${sanitizeSlug(name)}.md`);
}

function listTemplateFiles() {
  if (!fs.existsSync(ARCHETYPES_DIR)) return [];
  return fs.readdirSync(ARCHETYPES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => path.basename(f, ".md"));
}

function readTemplateFile(name) {
  const filePath = templateFilePath(name);
  if (!fs.existsSync(filePath)) return null;
  return {
    name: sanitizeSlug(name),
    content: fs.readFileSync(filePath, "utf8"),
    path: path.relative(ROOT, filePath).replace(/\\/g, "/"),
  };
}

function defaultTemplateContent(name) {
  const safeName = sanitizeSlug(name) || "new-template";
  return `---\ntitle: ""\ndate: 2026-03-13T00:00:00+08:00\ndraft: true\nsummary: ""\n---\n\n<!--more-->\n\nWrite here.\n`;
}

function regeneratePublisherArtifacts() {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "generate-publisher-templates.cjs")], { cwd: ROOT, stdio: "pipe" });
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "generate-decap-config.cjs")], { cwd: ROOT, stdio: "pipe" });
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

function ossSign(method, contentType, date, canonicalResource, accessKeySecret) {
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalResource}`;
  return crypto.createHmac("sha1", accessKeySecret).update(stringToSign).digest("base64");
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
  const signature = ossSign("GET", "", date, canonicalResource, accessKeySecret);
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
  const signature = ossSign("PUT", ctype, date, canonicalResource, accessKeySecret);
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
      headers: { "User-Agent": "Mozilla/5.0 (media-replacer)", Accept: "*/*" },
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

function extFromContentType(contentType, originalUrl) {
  const type = String(contentType || "").split(";")[0].trim().toLowerCase();
  const byMime = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  }[type];
  if (byMime) return byMime;
  if (originalUrl) {
    try {
      const pathname = new URL(originalUrl).pathname;
      const dot = pathname.lastIndexOf(".");
      if (dot > -1) return pathname.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
    } catch {}
  }
  return "bin";
}

function buildMediaFileName(index, contentType, originalUrl) {
  return `media-${String(index + 1).padStart(3, "0")}-${Date.now()}.${extFromContentType(contentType, originalUrl)}`;
}

async function handleMediaToolApi(req, res, pathname, body) {
  if (pathname === "/api/oss/test") {
    await ossListV2(body || {});
    return send(res, 200, {
      ok: true,
      message: "连接成功",
      bucket: body?.bucket,
      region: body?.region,
      objectCountSample: 1,
    });
  }

  if (pathname === "/api/media/upload-one") {
    const { ossConfig, item, index = 0, folderMode = "time_flat", customDir } = body || {};
    if (!ossConfig || !item || !item.src) return send(res, 400, { ok: false, message: "参数不完整" });
    const baseDir = buildBaseDir({ mode: folderMode, customDir });
    const payload = item.sourceType === "dataUrl" ? parseDataUrl(item.src) : await fetchBinaryFromUrl(item.src);
    const fileName = buildMediaFileName(index, payload.contentType, item.src);
    const objectKey = `${baseDir}/${fileName}`;
    const putRes = await ossPutObject(ossConfig, objectKey, payload.buffer, payload.contentType);
    return send(res, 200, {
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
  }

  if (pathname === "/api/media/replace") {
    const { ossConfig, mediaItems, rawText, folderMode = "time_flat", customDir } = body || {};
    if (!ossConfig || !Array.isArray(mediaItems)) return send(res, 400, { ok: false, message: "参数不完整" });
    const baseDir = buildBaseDir({ mode: folderMode, customDir });
    const uploads = [];
    let replacedText = String(rawText || "");
    for (let i = 0; i < mediaItems.length; i += 1) {
      const item = mediaItems[i];
      try {
        const payload = item.sourceType === "dataUrl" ? parseDataUrl(item.src) : await fetchBinaryFromUrl(item.src);
        const fileName = buildMediaFileName(i, payload.contentType, item.src);
        const objectKey = `${baseDir}/${fileName}`;
        const putRes = await ossPutObject(ossConfig, objectKey, payload.buffer, payload.contentType);
        uploads.push({ index: i, marker: item.marker, oldSrc: item.src, newSrc: putRes.url, status: "success", objectKey });
        if (item.marker && putRes.url) replacedText = replacedText.split(item.marker).join(putRes.url);
      } catch (err) {
        uploads.push({ index: i, marker: item.marker, oldSrc: item.src, status: "failed", error: err.message || "上传失败" });
      }
    }
    return send(res, 200, {
      ok: true,
      baseDir,
      uploads,
      replacedText,
      successCount: uploads.filter((x) => x.status === "success").length,
      failedCount: uploads.filter((x) => x.status === "failed").length,
      total: uploads.length,
    });
  }

  return false;
}

function serveMediaToolStatic(req, res, pathname) {
  if (!pathname.startsWith("/media-upload-tool")) return false;
  if (!fs.existsSync(MEDIA_TOOL_DIR) || !fs.statSync(MEDIA_TOOL_DIR).isDirectory()) {
    sendText(res, 503, mediaToolMissingPage(), MIME_TYPES[".html"]);
    return true;
  }
  const suffix = pathname.replace(/^\/media-upload-tool/, "") || "/";
  const relPath = suffix === "/" ? "index.html" : suffix.replace(/^\/+/, "");
  const filePath = path.join(MEDIA_TOOL_DIR, relPath);
  const resolved = path.resolve(filePath);
  const rootResolved = path.resolve(MEDIA_TOOL_DIR);
  if (!resolved.startsWith(rootResolved)) {
    sendText(res, 403, "Forbidden");
    return true;
  }
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    sendText(res, 404, "Not Found");
    return true;
  }
  let content = fs.readFileSync(resolved);
  const ext = path.extname(resolved).toLowerCase();
  if (relPath === "index.html") {
    const html = content.toString("utf8")
      .replace('href="/favicon.svg"', 'href="/media-upload-tool/favicon.svg"')
      .replace('href="/styles.css"', 'href="/media-upload-tool/styles.css"')
      .replace('src="/app.js"', 'src="/media-upload-tool/app.js"');
    sendText(res, 200, html, MIME_TYPES[".html"]);
    return true;
  }
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
  });
  res.end(content);
  return true;
}

function parseMarkdown(mdText) {
  const match = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: mdText };
  const fm = yaml.load(match[1]) || {};
  const body = String(match[2] || "").replace(/^\s*<!--more-->\s*/m, "").trimStart();
  return { frontmatter: fm, body };
}

function listItemsByTemplate(template) {
  const base = path.join(ROOT, "content", template);
  if (!fs.existsSync(base)) return [];
  const dirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const items = [];
  for (const slug of dirs) {
    const mdPath = path.join(base, slug, "index.md");
    if (!fs.existsSync(mdPath)) continue;
    const text = fs.readFileSync(mdPath, "utf8");
    const { frontmatter, body } = parseMarkdown(text);
    const filename =
      (frontmatter.image && typeof frontmatter.image === "object" && frontmatter.image.filename) ||
      (fs.existsSync(path.join(base, slug, "featured.jpg")) && "featured.jpg") ||
      (fs.existsSync(path.join(base, slug, "featured.png")) && "featured.png") ||
      (fs.existsSync(path.join(base, slug, "featured.webp")) && "featured.webp") ||
      "";
    const imageUrl = filename ? `/${template}/${slug}/${filename}` : "";
    const summary = frontmatter.summary || String(body || "").replace(/\s+/g, " ").trim().slice(0, 140);

    items.push({
      slug,
      title: frontmatter.title || slug,
      date: frontmatter.date || "",
      summary,
      imageUrl,
      path: path.relative(ROOT, mdPath).replace(/\\/g, "/"),
    });
  }

  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return items;
}

function readItem(template, slug) {
  const mdPath = path.join(ROOT, "content", template, slug, "index.md");
  if (!fs.existsSync(mdPath)) return null;
  const text = fs.readFileSync(mdPath, "utf8");
  const { frontmatter, body } = parseMarkdown(text);
  return {
    template,
    slug,
    frontmatter,
    body,
    markdownPath: path.relative(ROOT, mdPath).replace(/\\/g, "/"),
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });

  const u = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && serveMediaToolStatic(req, res, u.pathname)) return;

  if (req.method === "GET" && u.pathname === "/templates") {
    try {
      const p = path.join(ROOT, "static", "publisher", "templates.json");
      const json = JSON.parse(fs.readFileSync(p, "utf8"));
      return send(res, 200, json);
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) });
    }
  }

  if (req.method === "GET" && u.pathname === "/content") {
    try {
      const template = sanitizeSlug(u.searchParams.get("template"));
      if (!template) return send(res, 400, { error: "template 无效" });
      return send(res, 200, { ok: true, items: listItemsByTemplate(template) });
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) });
    }
  }

  if (req.method === "GET" && u.pathname === "/content/item") {
    try {
      const template = sanitizeSlug(u.searchParams.get("template"));
      const slug = sanitizeSlug(u.searchParams.get("slug"));
      if (!template || !slug) return send(res, 400, { error: "template 或 slug 无效" });
      const item = readItem(template, slug);
      if (!item) return send(res, 404, { error: "内容不存在" });
      return send(res, 200, { ok: true, item });
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) });
    }
  }

  if (req.method === "GET" && u.pathname === "/template-files") {
    try {
      return send(res, 200, { ok: true, items: listTemplateFiles() });
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) });
    }
  }

  if (req.method === "GET" && u.pathname === "/template-file") {
    try {
      const name = sanitizeSlug(u.searchParams.get("name"));
      if (!name) return send(res, 400, { error: "name 无效" });
      const item = readTemplateFile(name);
      if (!item) return send(res, 404, { error: "模板不存在" });
      return send(res, 200, { ok: true, item });
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) });
    }
  }

  if (req.method !== "POST" || (
    u.pathname !== "/publish" &&
    u.pathname !== "/update" &&
    u.pathname !== "/delete" &&
    u.pathname !== "/template-file" &&
    u.pathname !== "/api/oss/test" &&
    u.pathname !== "/api/media/replace" &&
    u.pathname !== "/api/media/upload-one"
  )) {
    return send(res, 405, { error: "Method Not Allowed" });
  }

  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    try {
      const payload = JSON.parse(raw || "{}");

      if (u.pathname === "/api/oss/test" || u.pathname === "/api/media/replace" || u.pathname === "/api/media/upload-one") {
        return Promise.resolve(handleMediaToolApi(req, res, u.pathname, payload)).catch((err) => {
          return send(res, 500, { ok: false, message: err.message || String(err) });
        });
      }

      if (u.pathname === "/template-file") {
        if (payload.password !== PASSWORD) return send(res, 401, { error: "密码错误" });
        const name = sanitizeSlug(payload.name);
        const content = String(payload.content || "");
        if (!name) return send(res, 400, { error: "模板名无效" });
        if (!content.trim()) return send(res, 400, { error: "模板内容不能为空" });
        ensureDir(ARCHETYPES_DIR);
        const filePath = templateFilePath(name);
        fs.writeFileSync(filePath, content, "utf8");
        regeneratePublisherArtifacts();
        return send(res, 200, {
          ok: true,
          item: {
            name,
            path: path.relative(ROOT, filePath).replace(/\\/g, "/"),
          },
        });
      }

      if (payload.password !== PASSWORD) return send(res, 401, { error: "密码错误" });

      const template = sanitizeSlug(payload.template);
      const slug = sanitizeSlug(payload.slug);
      if (!template || !slug) return send(res, 400, { error: "template 或 slug 无效" });

      if (u.pathname === "/delete") {
        const dir = path.join(ROOT, "content", template, slug);
        if (!fs.existsSync(dir)) return send(res, 404, { error: "内容不存在" });
        fs.rmSync(dir, { recursive: true, force: true });
        return send(res, 200, { ok: true, deletedPath: path.relative(ROOT, dir).replace(/\\/g, "/") });
      }

      if (u.pathname === "/publish") {
        const exists = fs.existsSync(path.join(ROOT, "content", template, slug, "index.md"));
        if (exists) return send(res, 409, { error: "slug 已存在，请使用修改模式或更换 slug" });
      }

      const frontmatter = normalizeDateFields(payload.frontmatter || {});
      const body = typeof frontmatter.body === "string" ? frontmatter.body : "";
      delete frontmatter.body;

      const dir = path.join(ROOT, "content", template, slug);
      ensureDir(dir);

      let featuredPath = null;
      if (payload.featured && payload.featured.base64 && payload.featured.mimeType) {
        const ext = payload.featured.mimeType.split("/")[1] || "png";
        const filename = `featured.${ext}`;
        const imgPath = path.join(dir, filename);
        fs.writeFileSync(imgPath, Buffer.from(payload.featured.base64, "base64"));
        featuredPath = path.relative(ROOT, imgPath).replace(/\\/g, "/");
        if (frontmatter.image && typeof frontmatter.image === "object") {
          frontmatter.image.filename = filename;
        }
      }

      const md = buildMarkdown(frontmatter, body);
      const mdPath = path.join(dir, "index.md");
      fs.writeFileSync(mdPath, md, "utf8");
      const markdownPath = path.relative(ROOT, mdPath).replace(/\\/g, "/");

      return send(res, 200, { ok: true, markdownPath, featuredPath });
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Local publish API running at http://127.0.0.1:${PORT}/publish`);
  console.log(`Password: ${PASSWORD}`);
  if (!fs.existsSync(MEDIA_TOOL_DIR) || !fs.statSync(MEDIA_TOOL_DIR).isDirectory()) {
    console.warn(`Media upload tool assets are missing: ${MEDIA_TOOL_DIR}`);
  }
});
