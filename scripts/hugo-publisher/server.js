const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ARCHETYPES_DIR = path.join(ROOT, 'archetypes');
const CONTENT_DIR = path.join(ROOT, 'content');
const WEB_DIR = path.join(__dirname, 'web');
const PORT = Number(process.env.PUBLISHER_PORT || 4312);

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function safeSlug(input) {
  return String(input || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase();
}

function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { front: '', body: raw };
  return { front: m[1], body: m[2] || '' };
}

function inferFieldType(value, block) {
  if (block) return 'yaml';
  const v = (value || '').trim();
  if (v === 'true' || v === 'false') return 'boolean';
  if (/^\d{4}-\d{2}-\d{2}T/.test(v) || /^['"]?\d{4}-\d{2}-\d{2}/.test(v)) return 'datetime';
  if (v.startsWith('[') && v.endsWith(']')) return 'list';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return 'string';
  return 'text';
}

function parseArchetypeFile(filePath) {
  const name = path.basename(filePath, '.md');
  const raw = fs.readFileSync(filePath, 'utf8');
  const { front, body } = splitFrontMatter(raw);
  const lines = front.split(/\r?\n/);
  const fields = [];
  let comments = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*#/.test(line)) {
      comments.push(line.replace(/^\s*#\s?/, '').trim());
      continue;
    }
    if (!line.trim()) {
      comments = [];
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) {
      comments = [];
      continue;
    }

    const key = keyMatch[1];
    const inlineValue = keyMatch[2] || '';
    const blockLines = [];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];
      if (/^[A-Za-z0-9_]+:\s*/.test(next)) break;
      if (/^\s+#/.test(next)) break;
      if (/^\s*$/.test(next) && j + 1 < lines.length && /^[A-Za-z0-9_]+:\s*/.test(lines[j + 1])) break;
      if (/^\s+/.test(next) || /^-\s+/.test(next)) {
        blockLines.push(next);
        j++;
        continue;
      }
      break;
    }

    i = j - 1;
    const block = blockLines.length > 0 ? blockLines.join('\n') : '';
    const hints = comments.join(' ').toLowerCase();
    const hasDefault = inlineValue.trim() !== '' || block.trim() !== '';
    const optionalHint = hints.includes('optional') || hints.includes('¿ÉÑ¡');
    const required = !hasDefault && !optionalHint;

    fields.push({
      key,
      type: inferFieldType(inlineValue, block),
      required,
      defaultInline: inlineValue,
      defaultBlock: block,
      hint: comments.join('\n'),
    });

    comments = [];
  }

  return {
    name,
    suggestedSection: name,
    fields,
    bodyTemplate: body,
  };
}

function listArchetypes() {
  const files = fs.readdirSync(ARCHETYPES_DIR).filter((f) => f.endsWith('.md'));
  return files.map((f) => parseArchetypeFile(path.join(ARCHETYPES_DIR, f)));
}

function decodeDataUrl(dataUrl) {
  const m = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
}

function pickImageExt(mime, filename) {
  const lower = String(filename || '').toLowerCase();
  if (lower.endsWith('.png')) return '.png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return '.jpg';
  if (lower.endsWith('.webp')) return '.webp';
  if (String(mime).includes('png')) return '.png';
  if (String(mime).includes('jpeg') || String(mime).includes('jpg')) return '.jpg';
  if (String(mime).includes('webp')) return '.webp';
  return '.png';
}

function quoteIfNeeded(v) {
  const s = String(v ?? '');
  if (!s) return '';
  if (/[:#\[\]\{\},]|^\s|\s$/.test(s)) return JSON.stringify(s);
  return s;
}

function buildFrontMatter(fields, values) {
  const out = ['---'];
  fields.forEach((f) => {
    const rawValue = values[f.key];
    if (f.type === 'yaml') {
      const text = String(rawValue ?? f.defaultBlock ?? '').trimEnd();
      out.push(`${f.key}:`);
      if (text) {
        text.split(/\r?\n/).forEach((line) => out.push(line ? `  ${line.replace(/^\s*/, '')}` : ''));
      }
      return;
    }

    let val = rawValue;
    if (val === undefined || val === null || val === '') {
      val = f.defaultInline || '';
    }

    if (f.type === 'boolean') {
      out.push(`${f.key}: ${String(val) === 'true' ? 'true' : 'false'}`);
      return;
    }

    if (f.type === 'list') {
      const t = String(val).trim();
      out.push(`${f.key}: ${t || '[]'}`);
      return;
    }

    out.push(`${f.key}: ${quoteIfNeeded(val)}`);
  });
  out.push('---');
  return out.join('\n');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 20 * 1024 * 1024) {
        reject(new Error('Request too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(WEB_DIR, reqPath);
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };
  res.writeHead(200, { 'Content-Type': typeMap[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/archetypes') {
      return sendJson(res, 200, { archetypes: listArchetypes() });
    }

    if (req.method === 'POST' && req.url === '/api/create') {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');

      const archetypes = listArchetypes();
      const archetype = archetypes.find((a) => a.name === payload.archetype);
      if (!archetype) return sendJson(res, 400, { error: 'Unknown archetype' });

      const section = safeSlug(payload.section || archetype.suggestedSection);
      const slug = safeSlug(payload.slug || payload.values?.title || 'new-post');
      if (!section || !slug) return sendJson(res, 400, { error: 'Section/slug invalid' });

      const bundleDir = path.join(CONTENT_DIR, section, slug);
      if (fs.existsSync(bundleDir)) return sendJson(res, 409, { error: `Target exists: content/${section}/${slug}` });
      fs.mkdirSync(bundleDir, { recursive: true });

      for (const field of archetype.fields) {
        if (field.required) {
          const v = payload.values?.[field.key];
          const empty = v === undefined || v === null || String(v).trim() === '';
          if (empty) return sendJson(res, 400, { error: `Missing required field: ${field.key}` });
        }
      }

      const frontMatter = buildFrontMatter(archetype.fields, payload.values || {});
      const body = String(payload.body ?? archetype.bodyTemplate ?? '').trimStart();
      fs.writeFileSync(path.join(bundleDir, 'index.md'), `${frontMatter}\n\n${body}\n`, 'utf8');

      if (payload.featured?.dataUrl) {
        const imageData = decodeDataUrl(payload.featured.dataUrl);
        if (!imageData) return sendJson(res, 400, { error: 'Invalid featured image data' });
        const ext = pickImageExt(imageData.mime, payload.featured.filename);
        fs.writeFileSync(path.join(bundleDir, `featured${ext}`), imageData.buffer);
      }

      return sendJson(res, 200, {
        ok: true,
        path: `content/${section}/${slug}/index.md`,
        section,
        slug,
      });
    }

    if (req.method === 'GET') return serveStatic(req, res);

    res.writeHead(404);
    res.end('Not Found');
  } catch (error) {
    sendJson(res, 500, { error: error.message || String(error) });
  }
});

server.listen(PORT, () => {
  console.log(`Hugo Publisher running at http://localhost:${PORT}`);
});
