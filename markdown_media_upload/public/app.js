const PROFILE_KEY = "oss_profiles_v1";
const THEME_KEY = "ui_theme_v1";

const state = {
  mediaItems: [],
  currentIndex: -1,
  excludedKeys: new Set(),
};

const el = {
  accessKeyId: document.getElementById("accessKeyId"),
  accessKeySecret: document.getElementById("accessKeySecret"),
  region: document.getElementById("region"),
  bucket: document.getElementById("bucket"),
  endpoint: document.getElementById("endpoint"),
  secure: document.getElementById("secure"),
  testConn: document.getElementById("testConn"),
  connStatus: document.getElementById("connStatus"),
  profileName: document.getElementById("profileName"),
  saveProfile: document.getElementById("saveProfile"),
  loadProfile: document.getElementById("loadProfile"),
  deleteProfile: document.getElementById("deleteProfile"),
  profileList: document.getElementById("profileList"),
  folderMode: document.getElementById("folderMode"),
  customDirWrap: document.getElementById("customDirWrap"),
  customDir: document.getElementById("customDir"),
  pasteText: document.getElementById("pasteText"),
  mediaStats: document.getElementById("mediaStats"),
  mediaList: document.getElementById("mediaList"),
  mediaPreview: document.getElementById("mediaPreview"),
  mediaPreviewMeta: document.getElementById("mediaPreviewMeta"),
  pasteRawBtn: document.getElementById("pasteRawBtn"),
  pasteRichBtn: document.getElementById("pasteRichBtn"),
  prevMedia: document.getElementById("prevMedia"),
  nextMedia: document.getElementById("nextMedia"),
  scanMedia: document.getElementById("scanMedia"),
  startReplace: document.getElementById("startReplace"),
  progressText: document.getElementById("progressText"),
  progressList: document.getElementById("progressList"),
  resultText: document.getElementById("resultText"),
  copyResult: document.getElementById("copyResult"),
  useResultAsInput: document.getElementById("useResultAsInput"),
  clearResult: document.getElementById("clearResult"),
  themeLightBtn: document.getElementById("themeLightBtn"),
  themeDarkBtn: document.getElementById("themeDarkBtn"),
};

function applyTheme(theme) {
  const next = theme === "cyber-dark" ? "cyber-dark" : "cyber-light";
  document.body.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  el.themeLightBtn.classList.toggle("active", next === "cyber-light");
  el.themeDarkBtn.classList.toggle("active", next === "cyber-dark");
}
function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const current = textarea.value;
  textarea.value = `${current.slice(0, start)}${text}${current.slice(end)}`;
  const nextPos = start + text.length;
  textarea.selectionStart = nextPos;
  textarea.selectionEnd = nextPos;
  textarea.focus();
}

function normalizeInlineText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function htmlToMarkdown(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function walk(node, inPre = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      return inPre ? node.nodeValue || "" : normalizeInlineText(node.nodeValue || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map((n) => walk(n, inPre || tag === "pre"));
    const joined = children.join(inPre ? "" : " ").replace(/[ \t]+\n/g, "\n").trim();

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      return `${"#".repeat(level)} ${joined}\n\n`;
    }
    if (tag === "p") return `${joined}\n\n`;
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `**${joined}**`;
    if (tag === "em" || tag === "i") return `*${joined}*`;
    if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") return `\`${joined}\``;
    if (tag === "pre") {
      const code = node.textContent || "";
      return `\n\`\`\`\n${code.replace(/\n$/, "")}\n\`\`\`\n\n`;
    }
    if (tag === "img") {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "img";
      return src ? `![${alt}](${src})` : "";
    }
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      const text = joined || href;
      return href ? `[${text}](${href})` : text;
    }
    if (tag === "li") return `- ${joined}\n`;
    if (tag === "ul" || tag === "ol") return `${children.join("")}\n`;
    if (tag === "blockquote") {
      return `${joined.split("\n").map((l) => `> ${l}`).join("\n")}\n\n`;
    }
    if (tag === "div" || tag === "section" || tag === "article") return `${joined}\n\n`;
    return joined;
  }

  const out = Array.from(doc.body.childNodes).map((n) => walk(n)).join("");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

async function readClipboardPayload() {
  if (!navigator.clipboard) {
    throw new Error("浏览器不支持 Clipboard API");
  }

  if (navigator.clipboard.read) {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes("text/html")) {
        const blob = await item.getType("text/html");
        return { kind: "html", value: await blob.text() };
      }
      if (item.types.includes("text/plain")) {
        const blob = await item.getType("text/plain");
        return { kind: "plain", value: await blob.text() };
      }
    }
  }

  const text = await navigator.clipboard.readText();
  return { kind: "plain", value: text || "" };
}

function getOssConfig() {
  return {
    accessKeyId: el.accessKeyId.value.trim(),
    accessKeySecret: el.accessKeySecret.value.trim(),
    region: el.region.value.trim(),
    bucket: el.bucket.value.trim(),
    endpoint: el.endpoint.value.trim(),
    secure: el.secure.value === "true",
  };
}

function setOssConfig(cfg) {
  el.accessKeyId.value = cfg.accessKeyId || "";
  el.accessKeySecret.value = cfg.accessKeySecret || "";
  el.region.value = cfg.region || "";
  el.bucket.value = cfg.bucket || "";
  el.endpoint.value = cfg.endpoint || "";
  el.secure.value = String(cfg.secure !== false);
}

function readProfiles() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function refreshProfileList() {
  const profiles = readProfiles();
  const names = Object.keys(profiles).sort();
  el.profileList.innerHTML = "";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "请选择已保存配置";
  el.profileList.appendChild(empty);

  names.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    el.profileList.appendChild(opt);
  });
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }
  return data;
}

async function postJsonWithTimeout(url, body, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.message || `Request failed: ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`请求超时(${Math.floor(timeoutMs / 1000)}s)，已跳过`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function appendProgress(text, cls = "") {
  const div = document.createElement("div");
  div.className = `progress-item ${cls}`.trim();
  div.textContent = text;
  el.progressList.appendChild(div);
  el.progressList.scrollTop = el.progressList.scrollHeight;
}

function isMediaLink(src) {
  return /\.(png|jpe?g|gif|webp|bmp|svg|mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(src) ||
    src.includes("/space/api/box/stream/download/") ||
    src.startsWith("data:image/") ||
    src.startsWith("data:video/") ||
    src.startsWith("blob:");
}

function isOverlap(start, end, ranges) {
  return ranges.some((r) => !(end <= r.start || start >= r.end));
}

function extractMediaRefs(rawText) {
  const ranges = [];

  // Markdown link/image: ![alt](url) or [text](url)
  const mdRegex = /(!?\[[^\]]*\]\()([^\s)]+)(\))/g;
  let m;
  while ((m = mdRegex.exec(rawText)) !== null) {
    const src = m[2];
    if (!isMediaLink(src)) continue;

    const start = m.index + m[1].length;
    const end = start + src.length;
    if (isOverlap(start, end, ranges)) continue;

    ranges.push({ start, end, src, tag: m[1].startsWith("![") ? "markdown-image" : "markdown-link" });
  }

  // HTML src/href attr
  const htmlRegex = /(src|href)\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  while ((m = htmlRegex.exec(rawText)) !== null) {
    const src = m[2] || m[3] || "";
    if (!isMediaLink(src)) continue;

    const whole = m[0];
    const rel = whole.indexOf(src);
    if (rel < 0) continue;

    const start = m.index + rel;
    const end = start + src.length;
    if (isOverlap(start, end, ranges)) continue;

    ranges.push({ start, end, src, tag: `html-${String(m[1]).toLowerCase()}` });
  }

  // Plain media URL
  const urlRegex = /https?:\/\/[^\s<>")']+/g;
  while ((m = urlRegex.exec(rawText)) !== null) {
    const src = m[0];
    if (!isMediaLink(src)) continue;

    const start = m.index;
    const end = start + src.length;
    if (isOverlap(start, end, ranges)) continue;

    ranges.push({ start, end, src, tag: "plain-url" });
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges.map((r, i) => ({
    index: i,
    start: r.start,
    end: r.end,
    src: r.src,
    tag: r.tag,
    sourceType: r.src.startsWith("data:") ? "dataUrl" : "url",
  }));
}

function mediaKey(item) {
  return `${item.start}:${item.end}:${item.src}`;
}

function tokenizeMedia(rawText, mediaItems) {
  const items = Array.isArray(mediaItems) ? mediaItems : extractMediaRefs(rawText);
  const mediaItemsFinal = items.filter((x) => !state.excludedKeys.has(mediaKey(x)));
  let textWithMarkers = String(rawText || "");

  const reversed = [...mediaItemsFinal].reverse();
  reversed.forEach((item) => {
    item.marker = `__MEDIA_REPLACE_${item.index}_${Date.now()}__`;
    textWithMarkers = textWithMarkers.slice(0, item.start) + item.marker + textWithMarkers.slice(item.end);
  });

  return { mediaItems: mediaItemsFinal, textWithMarkers };
}

function renderMediaPreview(item) {
  el.mediaPreview.innerHTML = "";
  if (!item) {
    el.mediaPreviewMeta.textContent = "未选中媒体";
    return;
  }

  el.mediaPreviewMeta.textContent = `#${item.index + 1} [${item.tag}]`;
  const src = item.src;
  const isVideo = /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(src) || src.startsWith("data:video/");

  if (isVideo) {
    const v = document.createElement("video");
    v.controls = true;
    v.src = src;
    v.style.maxWidth = "100%";
    v.style.maxHeight = "260px";
    el.mediaPreview.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "media preview";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "260px";
    img.style.objectFit = "contain";
    img.onerror = () => {
      el.mediaPreview.innerHTML = `<a href="${src}" target="_blank" rel="noreferrer">预览失败，点此新窗口打开</a>`;
    };
    el.mediaPreview.appendChild(img);
  }
}

function scanMediaFromText() {
  state.mediaItems = extractMediaRefs(el.pasteText.value);
  state.currentIndex = state.mediaItems.length > 0 ? 0 : -1;

  const activeCount = state.mediaItems.filter((x) => !state.excludedKeys.has(mediaKey(x))).length;
  el.mediaStats.textContent = `共发现 ${state.mediaItems.length} 个 media，待上传 ${activeCount} 个`;
  el.mediaList.innerHTML = "";

  state.mediaItems.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "progress-item";
    div.dataset.mediaIndex = String(i);
    const removed = state.excludedKeys.has(mediaKey(item));
    div.textContent = `#${i + 1} [${item.tag}] ${item.src}${removed ? "  (已排除)" : ""}`;
    const removeBtn = document.createElement("button");
    removeBtn.className = "secondary";
    removeBtn.textContent = removed ? "恢复" : "删除";
    removeBtn.style.padding = "4px 10px";
    removeBtn.style.marginLeft = "8px";
    removeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const key = mediaKey(item);
      if (state.excludedKeys.has(key)) {
        state.excludedKeys.delete(key);
      } else {
        state.excludedKeys.add(key);
      }
      scanMediaFromText();
    });
    div.appendChild(removeBtn);
    div.addEventListener("click", () => {
      state.currentIndex = i;
      focusCurrentMedia();
    });
    el.mediaList.appendChild(div);
  });

  focusCurrentMedia();
}

function focusCurrentMedia() {
  const items = el.mediaList.querySelectorAll("[data-media-index]");
  items.forEach((node) => {
    node.style.background = "";
    node.style.borderRadius = "";
  });

  if (state.currentIndex < 0) {
    renderMediaPreview(null);
    return;
  }

  const node = el.mediaList.querySelector(`[data-media-index=\"${state.currentIndex}\"]`);
  if (node) {
    node.style.background = "#ffe3bf";
    node.style.borderRadius = "6px";
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  renderMediaPreview(state.mediaItems[state.currentIndex]);
}

el.folderMode.addEventListener("change", () => {
  el.customDirWrap.style.display = el.folderMode.value === "custom" ? "block" : "none";
});

el.saveProfile.addEventListener("click", () => {
  const name = el.profileName.value.trim();
  if (!name) {
    el.connStatus.textContent = "请先填写配置名称";
    el.connStatus.className = "fail";
    return;
  }

  const profiles = readProfiles();
  profiles[name] = getOssConfig();
  writeProfiles(profiles);
  refreshProfileList();
  el.profileList.value = name;
  el.connStatus.textContent = `已保存配置: ${name}`;
  el.connStatus.className = "ok";
});

el.loadProfile.addEventListener("click", () => {
  const name = el.profileList.value;
  const profiles = readProfiles();
  const config = profiles[name];

  if (!name || !config) {
    el.connStatus.textContent = "请选择有效配置";
    el.connStatus.className = "fail";
    return;
  }

  setOssConfig(config);
  el.profileName.value = name;
  el.connStatus.textContent = `已载入配置: ${name}`;
  el.connStatus.className = "ok";
});

el.deleteProfile.addEventListener("click", () => {
  const name = el.profileList.value;
  const profiles = readProfiles();

  if (!name || !profiles[name]) {
    el.connStatus.textContent = "请选择有效配置";
    el.connStatus.className = "fail";
    return;
  }

  delete profiles[name];
  writeProfiles(profiles);
  refreshProfileList();
  el.profileName.value = "";
  el.connStatus.textContent = `已删除配置: ${name}`;
  el.connStatus.className = "ok";
});

el.testConn.addEventListener("click", async () => {
  try {
    el.connStatus.textContent = "连接中...";
    const result = await postJson("/api/oss/test", getOssConfig());
    el.connStatus.textContent = `连接成功: ${result.bucket} (${result.region})`;
    el.connStatus.className = "ok";
  } catch (err) {
    el.connStatus.textContent = `连接失败: ${err.message}`;
    el.connStatus.className = "fail";
  }
});

el.pasteRawBtn.addEventListener("click", async () => {
  try {
    const payload = await readClipboardPayload();
    const text = payload.value || "";
    insertAtCursor(el.pasteText, text);
    scanMediaFromText();
    el.progressText.textContent = "已按原样粘贴到输入框";
  } catch (err) {
    el.progressText.textContent = `原样粘贴失败: ${err.message}`;
  }
});

el.pasteRichBtn.addEventListener("click", async () => {
  try {
    const payload = await readClipboardPayload();
    const text = payload.kind === "html" ? htmlToMarkdown(payload.value) : payload.value;
    insertAtCursor(el.pasteText, text || "");
    scanMediaFromText();
    el.progressText.textContent = payload.kind === "html"
      ? "已完成富文本转 Markdown 粘贴"
      : "剪贴板无 HTML，已按纯文本粘贴";
  } catch (err) {
    el.progressText.textContent = `富文本粘贴失败: ${err.message}`;
  }
});

el.pasteText.addEventListener("paste", () => {
  setTimeout(scanMediaFromText, 0);
});
el.pasteText.addEventListener("input", () => {
  setTimeout(scanMediaFromText, 0);
});

el.scanMedia.addEventListener("click", scanMediaFromText);

el.prevMedia.addEventListener("click", () => {
  if (!state.mediaItems.length) return;
  state.currentIndex = (state.currentIndex - 1 + state.mediaItems.length) % state.mediaItems.length;
  focusCurrentMedia();
});

el.nextMedia.addEventListener("click", () => {
  if (!state.mediaItems.length) return;
  state.currentIndex = (state.currentIndex + 1) % state.mediaItems.length;
  focusCurrentMedia();
});

el.startReplace.addEventListener("click", async () => {
  try {
    el.progressList.innerHTML = "";
    el.progressText.textContent = "正在准备...";

    const latestItems = extractMediaRefs(el.pasteText.value);
    const tokenized = tokenizeMedia(el.pasteText.value, latestItems);
    if (!tokenized.mediaItems.length) {
      appendProgress("未发现可替换 media（或均已手动排除）", "fail");
      el.progressText.textContent = "未执行";
      return;
    }

    const total = tokenized.mediaItems.length;
    let done = 0;
    let success = 0;
    let failed = 0;
    let replacedText = tokenized.textWithMarkers;

    appendProgress(`开始上传，总数 ${total}`);

    for (let i = 0; i < tokenized.mediaItems.length; i += 1) {
      const item = tokenized.mediaItems[i];
      el.progressText.textContent = `上传中: ${done}/${total}`;

      try {
        const result = await postJsonWithTimeout("/api/media/upload-one", {
          ossConfig: getOssConfig(),
          item,
          index: i,
          folderMode: el.folderMode.value,
          customDir: el.customDir.value,
        }, 45000);

        const upload = result.upload || {};
        done += 1;
        success += 1;
        if (upload.marker && upload.newSrc) {
          replacedText = replacedText.split(upload.marker).join(upload.newSrc);
        }
        appendProgress(`[${done}/${total}] 成功 -> ${upload.newSrc}`, "ok");
      } catch (err) {
        done += 1;
        failed += 1;
        appendProgress(`[${done}/${total}] 失败 -> ${err.message}`, "fail");
      }

      el.progressText.textContent = `进行中: ${done}/${total} (成功 ${success} / 失败 ${failed})`;
    }

    el.progressText.textContent = `完成: 成功 ${success} / 失败 ${failed}`;
    el.resultText.value = replacedText;
  } catch (err) {
    el.progressText.textContent = `失败: ${err.message}`;
    appendProgress(`任务失败: ${err.message}`, "fail");
  }
});

el.copyResult.addEventListener("click", async () => {
  const text = el.resultText.value || "";
  if (!text) {
    el.progressText.textContent = "结果为空，无可复制内容";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    el.progressText.textContent = "结果已复制到剪贴板";
  } catch {
    el.resultText.focus();
    el.resultText.select();
    document.execCommand("copy");
    el.progressText.textContent = "结果已复制到剪贴板";
  }
});

el.useResultAsInput.addEventListener("click", () => {
  el.pasteText.value = el.resultText.value || "";
  scanMediaFromText();
  el.progressText.textContent = "已将结果回填到输入框";
});

el.clearResult.addEventListener("click", () => {
  el.resultText.value = "";
  el.progressText.textContent = "结果已清空";
});

el.themeLightBtn.addEventListener("click", () => applyTheme("cyber-light"));
el.themeDarkBtn.addEventListener("click", () => applyTheme("cyber-dark"));

applyTheme(localStorage.getItem(THEME_KEY) || "cyber-light");
refreshProfileList();
scanMediaFromText();





