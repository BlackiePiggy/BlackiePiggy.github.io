(function () {
  "use strict";

  const PROFILE_KEY = "oss_profiles_v1";
  const PUBLISHER_API_KEY = "publisher_api_base";

  function normalizeInlineText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function htmlToMarkdown(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    function walk(node, inPre) {
      if (node.nodeType === Node.TEXT_NODE) {
        return inPre ? node.nodeValue || "" : normalizeInlineText(node.nodeValue || "");
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return "";

      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map((n) => walk(n, inPre || tag === "pre"));
      const joined = children.join(inPre ? "" : " ").replace(/[ \t]+\n/g, "\n").trim();

      if (/^h[1-6]$/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${joined}\n\n`;
      if (tag === "p") return `${joined}\n\n`;
      if (tag === "br") return "\n";
      if (tag === "strong" || tag === "b") return `**${joined}**`;
      if (tag === "em" || tag === "i") return `*${joined}*`;
      if (tag === "code" && node.parentElement && node.parentElement.tagName.toLowerCase() !== "pre") return `\`${joined}\``;
      if (tag === "pre") return `\n\`\`\`\n${(node.textContent || "").replace(/\n$/, "")}\n\`\`\`\n\n`;
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
      if (tag === "blockquote") return `${joined.split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
      if (tag === "div" || tag === "section" || tag === "article") return `${joined}\n\n`;
      return joined;
    }

    const out = Array.from(doc.body.childNodes).map((n) => walk(n, false)).join("");
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  async function readClipboardPayload() {
    if (!navigator.clipboard) throw new Error("浏览器不支持 Clipboard API");
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

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart == null ? textarea.value.length : textarea.selectionStart;
    const end = textarea.selectionEnd == null ? textarea.value.length : textarea.selectionEnd;
    textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
    const next = start + text.length;
    textarea.selectionStart = next;
    textarea.selectionEnd = next;
    textarea.focus();
  }

  function isMediaLink(src) {
    return /\.(png|jpe?g|gif|webp|bmp|svg|mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(src) ||
      src.indexOf("/space/api/box/stream/download/") > -1 ||
      src.startsWith("data:image/") ||
      src.startsWith("data:video/") ||
      src.startsWith("blob:");
  }

  function isOverlap(start, end, ranges) {
    return ranges.some((r) => !(end <= r.start || start >= r.end));
  }

  function extractMediaRefs(rawText) {
    const ranges = [];
    let m;

    const mdRegex = /(!?\[[^\]]*\]\()([^\s)]+)(\))/g;
    while ((m = mdRegex.exec(rawText)) !== null) {
      const src = m[2];
      if (!isMediaLink(src)) continue;
      const start = m.index + m[1].length;
      const end = start + src.length;
      if (isOverlap(start, end, ranges)) continue;
      ranges.push({ start, end, src, tag: m[1].indexOf("![") === 0 ? "markdown-image" : "markdown-link" });
    }

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

  function tokenizeMedia(rawText, mediaItems, excludedKeysSet) {
    const excluded = excludedKeysSet || new Set();
    const activeItems = (Array.isArray(mediaItems) ? mediaItems : extractMediaRefs(rawText))
      .filter((x) => !excluded.has(mediaKey(x)));
    let textWithMarkers = String(rawText || "");
    const reversed = activeItems.slice().reverse();
    reversed.forEach((item) => {
      item.marker = `__MEDIA_REPLACE_${item.index}_${Date.now()}__`;
      textWithMarkers = textWithMarkers.slice(0, item.start) + item.marker + textWithMarkers.slice(item.end);
    });
    return { mediaItems: activeItems, textWithMarkers };
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
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles || {}));
  }

  function getProfile(name) {
    if (!name) return null;
    const profiles = readProfiles();
    return profiles[name] || null;
  }

  function listProfiles() {
    return Object.keys(readProfiles()).sort();
  }

  function apiUrl(path) {
    const local = ["localhost", "127.0.0.1"].indexOf(location.hostname) > -1;
    const fallback = local ? "http://127.0.0.1:8790" : "";
    const base = (localStorage.getItem(PUBLISHER_API_KEY) || fallback).replace(/\/+$/, "");
    return base ? `${base}${path}` : path;
  }

  async function postJsonWithTimeout(url, body, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 45000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.message || `Request failed: ${res.status}`);
      return data;
    } catch (err) {
      if (err && err.name === "AbortError") throw new Error(`请求超时(${Math.floor((timeoutMs || 45000) / 1000)}s)`);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function testOssConnection(ossConfig) {
    const res = await postJsonWithTimeout(apiUrl("/api/oss/test"), ossConfig, 30000);
    return res;
  }

  async function replaceMediaInText(options) {
    const rawText = String(options && options.rawText || "");
    const scanItems = extractMediaRefs(rawText);
    const tokenized = tokenizeMedia(rawText, scanItems, options && options.excludedKeys);
    const total = tokenized.mediaItems.length;
    let done = 0;
    let success = 0;
    let failed = 0;
    let replacedText = tokenized.textWithMarkers;

    if (typeof options.onStart === "function") {
      options.onStart({ total, allItems: scanItems, activeItems: tokenized.mediaItems });
    }

    for (let i = 0; i < tokenized.mediaItems.length; i += 1) {
      const item = tokenized.mediaItems[i];
      if (typeof options.onProgress === "function") {
        options.onProgress({ phase: "before", index: i, done, total, success, failed, item });
      }
      try {
        const result = await postJsonWithTimeout(apiUrl("/api/media/upload-one"), {
          ossConfig: options.ossConfig,
          item,
          index: i,
          folderMode: options.folderMode || "time_flat",
          customDir: options.customDir || "",
        }, options.timeoutMs || 45000);
        const upload = result.upload || {};
        done += 1;
        success += 1;
        if (upload.marker && upload.newSrc) replacedText = replacedText.split(upload.marker).join(upload.newSrc);
        if (typeof options.onProgress === "function") {
          options.onProgress({ phase: "after", status: "success", index: i, done, total, success, failed, item, upload });
        }
      } catch (err) {
        done += 1;
        failed += 1;
        if (typeof options.onProgress === "function") {
          options.onProgress({ phase: "after", status: "failed", index: i, done, total, success, failed, item, error: err.message || "上传失败" });
        }
      }
    }

    return { replacedText, total, success, failed, mediaItems: tokenized.mediaItems, allItems: scanItems };
  }

  window.PublisherMediaTools = {
    PROFILE_KEY,
    readProfiles,
    writeProfiles,
    getProfile,
    listProfiles,
    apiUrl,
    htmlToMarkdown,
    readClipboardPayload,
    insertAtCursor,
    extractMediaRefs,
    mediaKey,
    tokenizeMedia,
    testOssConnection,
    replaceMediaInText,
  };
})();
