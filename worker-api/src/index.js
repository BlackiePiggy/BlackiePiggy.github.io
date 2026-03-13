function json(data, status = 200, corsOrigin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
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

function buildMarkdown(frontmatter, body = "") {
  const cleanBody = String(body || "").replace(/<!--more-->/g, "").replace(/^\s+/, "");
  return `---\n${toYaml(frontmatter)}\n---\n\n<!--more-->\n\n${cleanBody}\n`;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

async function githubPutFile({ token, owner, repo, branch, filePath, base64, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "gh-pages-publisher-worker",
    "Content-Type": "application/json",
  };

  const getRes = await fetch(url, { headers });
  let sha;
  if (getRes.status === 200) {
    const existing = await getRes.json();
    sha = existing.sha;
  } else if (getRes.status !== 404) {
    throw new Error(`读取 GitHub 文件失败: ${getRes.status}`);
  }

  const putRes = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ message, content: base64, branch, sha }),
  });
  if (!putRes.ok) {
    const detail = await putRes.text();
    throw new Error(`写入 GitHub 文件失败: ${putRes.status} ${detail}`);
  }
}

export default {
  async fetch(request, env) {
    const corsOrigin = env.CORS_ORIGIN || "*";
    if (request.method === "OPTIONS") return json({ ok: true }, 200, corsOrigin);
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405, corsOrigin);

    try {
      const payload = await request.json();
      if (!env.PUBLISH_PASSWORD) return json({ error: "缺少 PUBLISH_PASSWORD" }, 500, corsOrigin);
      if (payload.password !== env.PUBLISH_PASSWORD) return json({ error: "密码错误" }, 401, corsOrigin);

      if (!env.GITHUB_TOKEN || !env.GITHUB_REPO_OWNER || !env.GITHUB_REPO_NAME) {
        return json({ error: "缺少 GitHub 环境变量" }, 500, corsOrigin);
      }

      const template = sanitizeSlug(payload.template);
      const slug = sanitizeSlug(payload.slug);
      if (!template || !slug) return json({ error: "template 或 slug 无效" }, 400, corsOrigin);

      const frontmatter = normalizeDateFields(payload.frontmatter || {});
      const body = typeof frontmatter.body === "string" ? frontmatter.body : "";
      delete frontmatter.body;

      const branch = env.GITHUB_REPO_BRANCH || "main";
      let featuredPath = null;
      if (payload.featured && payload.featured.base64 && payload.featured.mimeType) {
        const ext = payload.featured.mimeType.split("/")[1] || "png";
        const filename = `featured.${ext}`;
        featuredPath = `content/${template}/${slug}/${filename}`;
        if (frontmatter.image && typeof frontmatter.image === "object") frontmatter.image.filename = filename;

        await githubPutFile({
          token: env.GITHUB_TOKEN,
          owner: env.GITHUB_REPO_OWNER,
          repo: env.GITHUB_REPO_NAME,
          branch,
          filePath: featuredPath,
          base64: payload.featured.base64,
          message: `feat(content): add featured for ${template}/${slug}`,
        });
      }

      const markdownPath = `content/${template}/${slug}/index.md`;
      const markdown = buildMarkdown(frontmatter, body);

      await githubPutFile({
        token: env.GITHUB_TOKEN,
        owner: env.GITHUB_REPO_OWNER,
        repo: env.GITHUB_REPO_NAME,
        branch,
        filePath: markdownPath,
        base64: utf8ToBase64(markdown),
        message: `feat(content): publish ${template}/${slug}`,
      });

      return json({ ok: true, markdownPath, featuredPath }, 200, corsOrigin);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500, corsOrigin);
    }
  },
};
