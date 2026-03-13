const http = require("http");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const PORT = Number(process.env.LOCAL_PUBLISH_PORT || 8788);
const ROOT = process.cwd();
const PASSWORD = process.env.LOCAL_PUBLISH_PASSWORD || "dev123456";
const CORS_ORIGIN = process.env.LOCAL_PUBLISH_CORS_ORIGIN || "*";

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
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
    const { frontmatter } = parseMarkdown(text);
    items.push({
      slug,
      title: frontmatter.title || slug,
      date: frontmatter.date || "",
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

  if (req.method !== "POST" || (u.pathname !== "/publish" && u.pathname !== "/update")) {
    return send(res, 405, { error: "Method Not Allowed" });
  }

  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    try {
      const payload = JSON.parse(raw || "{}");
      if (payload.password !== PASSWORD) return send(res, 401, { error: "密码错误" });

      const template = sanitizeSlug(payload.template);
      const slug = sanitizeSlug(payload.slug);
      if (!template || !slug) return send(res, 400, { error: "template 或 slug 无效" });

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
});
