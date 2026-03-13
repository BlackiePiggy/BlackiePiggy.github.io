const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = process.cwd();
const ARCHETYPES_DIR = path.join(ROOT, 'archetypes');
const OUTPUT_DIR = path.join(ROOT, 'static', 'publisher');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'templates.json');

function extractFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : '';
}

function sanitizeTemplating(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => {
      if (!line.includes(':')) return line;
      if (/^\s*#/.test(line)) return line;
      const m = line.match(/^(\s*[^:#][^:]*:\s*)(.*)$/);
      if (!m) return line;
      const [, prefix, value] = m;
      const trimmed = value.trim();
      if (!trimmed) return line;
      if (/\{\{.*\}\}/.test(trimmed)) return `${prefix}"TEMPLATE_VALUE"`;
      return line;
    })
    .join('\n');
}

function isDateLike(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

function detectType(name, value) {
  if (value instanceof Date) return 'datetime';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (/^date$|date$|_at$|^publishDate$/i.test(name) || isDateLike(value)) return 'datetime';
    return 'string';
  }
  if (Array.isArray(value)) return 'list';
  if (value && typeof value === 'object') return 'object';
  return 'string';
}

function fieldFromValue(name, value) {
  const type = detectType(name, value);
  const field = { name, type, default: normalizeDefault(value) };

  if (type === 'object') {
    field.fields = Object.keys(value).map((k) => fieldFromValue(k, value[k]));
  } else if (type === 'list') {
    const first = value[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      field.itemType = 'object';
      field.fields = Object.keys(first).map((k) => fieldFromValue(k, first[k]));
    } else {
      field.itemType = detectType('item', first);
    }
  }

  return field;
}

function normalizeDefault(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeDefault(v);
    return out;
  }
  if (value === undefined) return null;
  return value;
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const templates = fs
    .readdirSync(ARCHETYPES_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const name = path.basename(file, '.md');
      const raw = fs.readFileSync(path.join(ARCHETYPES_DIR, file), 'utf8');
      const fmRaw = extractFrontMatter(raw);
      if (!fmRaw) return null;

      try {
        const fm = yaml.load(sanitizeTemplating(fmRaw)) || {};
        return {
          name,
          fields: Object.keys(fm).map((k) => fieldFromValue(k, fm[k])),
        };
      } catch (err) {
        console.warn(`Skipping ${file}: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), templates }, null, 2), 'utf8');
  console.log(`Generated ${OUTPUT_PATH} with ${templates.length} templates.`);
}

main();
