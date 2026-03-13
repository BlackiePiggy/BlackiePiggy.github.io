const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = process.cwd();
const ARCHETYPES_DIR = path.join(ROOT, 'archetypes');
const OUTPUT_PATH = path.join(ROOT, 'static', 'admin', 'config.yml');

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
      const quoted = trimmed.startsWith('"') || trimmed.startsWith("'");
      if (/\{\{.*\}\}/.test(trimmed)) {
        return `${prefix}"TEMPLATE_VALUE"`;
      }
      return line;
    })
    .join('\n');
}

function inferWidget(name, value) {
  const required = hasValue(value);

  if (value instanceof Date) {
    return { label: toLabel(name), name, widget: 'datetime', required: true };
  }

  if (typeof value === 'boolean') {
    return { label: toLabel(name), name, widget: 'boolean', required, default: value };
  }

  if (typeof value === 'number') {
    return { label: toLabel(name), name, widget: 'number', required };
  }

  if (typeof value === 'string') {
    if (isImageField(name)) {
      return { label: toLabel(name), name, widget: 'image', required };
    }
    if (isDateField(name) || isDateLike(value)) {
      return { label: toLabel(name), name, widget: 'datetime', required };
    }
    return {
      label: toLabel(name),
      name,
      widget: value.length > 120 ? 'text' : 'string',
      required,
    };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        label: toLabel(name),
        name,
        widget: 'list',
        required: false,
        field: { label: 'Item', name: 'item', widget: 'string', required: false },
      };
    }

    const first = value[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      return {
        label: toLabel(name),
        name,
        widget: 'list',
        required,
        fields: Object.keys(first).map((k) => inferWidget(k, first[k])),
      };
    }

    return {
      label: toLabel(name),
      name,
      widget: 'list',
      required,
      field: inferListPrimitiveField(first),
    };
  }

  if (value && typeof value === 'object') {
    return {
      label: toLabel(name),
      name,
      widget: 'object',
      required,
      fields: Object.keys(value).map((k) => inferWidget(k, value[k])),
    };
  }

  return { label: toLabel(name), name, widget: 'string', required: false };
}

function inferListPrimitiveField(value) {
  if (typeof value === 'boolean') {
    return { label: 'Item', name: 'item', widget: 'boolean', required: false };
  }
  if (typeof value === 'number') {
    return { label: 'Item', name: 'item', widget: 'number', required: false };
  }
  if (typeof value === 'string' && isDateLike(value)) {
    return { label: 'Item', name: 'item', widget: 'datetime', required: false };
  }
  return { label: 'Item', name: 'item', widget: 'string', required: false };
}

function isDateLike(value) {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

function isDateField(name) {
  return /(^date$|date$|_at$|^publishDate$)/i.test(name);
}

function isImageField(name) {
  return /(^image$|image$|img$|photo$|picture$|thumbnail$|cover$|filename$)/i.test(name);
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (value instanceof Date) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some((v) => hasValue(v));
  }
  return false;
}

function toLabel(name) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCollection(name, frontmatterObj) {
  const folderName = name;
  const fields = Object.keys(frontmatterObj).map((k) => inferWidget(k, frontmatterObj[k]));

  if (!fields.some((f) => f.name === 'body')) {
    fields.push({ label: 'Body', name: 'body', widget: 'markdown', required: false });
  }

  return {
    name,
    label: toLabel(name),
    folder: `content/${folderName}`,
    extension: 'md',
    format: 'frontmatter',
    create: true,
    nested: { depth: 2 },
    path: '{{slug}}/index',
    slug: '{{slug}}',
    fields,
  };
}

function main() {
  const files = fs
    .readdirSync(ARCHETYPES_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const collections = [];

  for (const file of files) {
    const name = path.basename(file, '.md');
    const content = fs.readFileSync(path.join(ARCHETYPES_DIR, file), 'utf8');
    const rawFm = extractFrontMatter(content);
    if (!rawFm) continue;

    const sanitized = sanitizeTemplating(rawFm);
    let fm = {};

    try {
      fm = yaml.load(sanitized) || {};
    } catch (err) {
      console.warn(`Skipping ${file}: failed to parse front matter - ${err.message}`);
      continue;
    }

    collections.push(buildCollection(name, fm));
  }

  const config = {
    backend: { name: 'git-gateway', branch: 'main' },
    media_folder: 'static/images/uploads',
    public_folder: '/images/uploads',
    collections,
  };

  const header = '# AUTO-GENERATED by scripts/generate-decap-config.cjs\n';
  const yamlText = yaml.dump(config, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });

  fs.writeFileSync(OUTPUT_PATH, `${header}${yamlText}`, 'utf8');
  console.log(`Generated ${OUTPUT_PATH} with ${collections.length} collections.`);
}

main();
