var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RdocPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/assets.ts
var RDOC_VERSION = "1.0.0";
var READER_CSS = '/* rdoc reader \u2014 adaptive offline typography, no external fonts */\r\n:root {\r\n  color-scheme: light dark;\r\n  --bg: #f7f5f1;\r\n  --bg-elev: #ffffff;\r\n  --fg: #1a1a1a;\r\n  --muted: #5c5c5c;\r\n  --border: #e2ddd4;\r\n  --accent: #0b6e4f;\r\n  --accent-soft: #d8efe6;\r\n  --callout: #fff8e7;\r\n  --callout-border: #e6c86a;\r\n  --code-bg: #f0ece4;\r\n  --shadow: 0 8px 28px rgba(26, 26, 26, 0.12);\r\n  --measure: 42rem;\r\n  --pad: clamp(1rem, 4vw, 1.75rem);\r\n  --fs: 1.0625rem;\r\n  --lh: 1.7;\r\n  --radius: 10px;\r\n  --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto,\r\n    "Helvetica Neue", Arial, sans-serif;\r\n  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono",\r\n    monospace;\r\n}\r\n\r\n@media (prefers-color-scheme: dark) {\r\n  :root:not([data-theme="light"]) {\r\n    --bg: #121416;\r\n    --bg-elev: #1b1e22;\r\n    --fg: #ececec;\r\n    --muted: #a0a6ad;\r\n    --border: #2c3238;\r\n    --accent: #5dcea2;\r\n    --accent-soft: #1a332a;\r\n    --callout: #2a2618;\r\n    --callout-border: #8a7430;\r\n    --code-bg: #23282e;\r\n    --shadow: 0 10px 32px rgba(0, 0, 0, 0.45);\r\n  }\r\n}\r\n\r\n:root[data-theme="dark"] {\r\n  --bg: #121416;\r\n  --bg-elev: #1b1e22;\r\n  --fg: #ececec;\r\n  --muted: #a0a6ad;\r\n  --border: #2c3238;\r\n  --accent: #5dcea2;\r\n  --accent-soft: #1a332a;\r\n  --callout: #2a2618;\r\n  --callout-border: #8a7430;\r\n  --code-bg: #23282e;\r\n  --shadow: 0 10px 32px rgba(0, 0, 0, 0.45);\r\n}\r\n\r\n:root[data-theme="light"] {\r\n  --bg: #f7f5f1;\r\n  --bg-elev: #ffffff;\r\n  --fg: #1a1a1a;\r\n  --muted: #5c5c5c;\r\n  --border: #e2ddd4;\r\n  --accent: #0b6e4f;\r\n  --accent-soft: #d8efe6;\r\n  --callout: #fff8e7;\r\n  --callout-border: #e6c86a;\r\n  --code-bg: #f0ece4;\r\n  --shadow: 0 8px 28px rgba(26, 26, 26, 0.12);\r\n}\r\n\r\n*,\r\n*::before,\r\n*::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\nhtml {\r\n  scroll-behavior: smooth;\r\n  -webkit-text-size-adjust: 100%;\r\n}\r\n\r\nbody {\r\n  margin: 0;\r\n  font-family: var(--ui);\r\n  font-size: var(--fs);\r\n  line-height: var(--lh);\r\n  color: var(--fg);\r\n  background: var(--bg);\r\n  text-rendering: optimizeLegibility;\r\n}\r\n\r\n/* reading progress */\r\n#rdoc-progress {\r\n  position: fixed;\r\n  inset: 0 auto auto 0;\r\n  height: 3px;\r\n  width: 0;\r\n  z-index: 60;\r\n  background: var(--accent);\r\n  pointer-events: none;\r\n}\r\n\r\n/* chrome */\r\n.rdoc-bar {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: 40;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.5rem;\r\n  padding: 0.55rem var(--pad);\r\n  background: color-mix(in srgb, var(--bg-elev) 92%, transparent);\r\n  backdrop-filter: blur(10px);\r\n  border-bottom: 1px solid var(--border);\r\n}\r\n\r\n.rdoc-bar button {\r\n  appearance: none;\r\n  border: 1px solid var(--border);\r\n  background: var(--bg-elev);\r\n  color: var(--fg);\r\n  font: inherit;\r\n  font-size: 0.875rem;\r\n  padding: 0.4rem 0.7rem;\r\n  border-radius: 8px;\r\n  cursor: pointer;\r\n  min-height: 2.25rem;\r\n}\r\n\r\n.rdoc-bar button:hover,\r\n.rdoc-bar button:focus-visible {\r\n  border-color: var(--accent);\r\n  outline: none;\r\n}\r\n\r\n.rdoc-bar .spacer {\r\n  flex: 1;\r\n}\r\n\r\n.rdoc-title-chip {\r\n  font-size: 0.8125rem;\r\n  color: var(--muted);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  max-width: 40vw;\r\n}\r\n\r\n/* layout */\r\n.rdoc-shell {\r\n  display: grid;\r\n  grid-template-columns: 1fr;\r\n  max-width: calc(var(--measure) + 16rem);\r\n  margin: 0 auto;\r\n}\r\n\r\n.rdoc-toc {\r\n  display: none;\r\n  position: fixed;\r\n  inset: auto 0 0 0;\r\n  z-index: 50;\r\n  max-height: min(70vh, 28rem);\r\n  overflow: auto;\r\n  padding: 1rem var(--pad) 1.25rem;\r\n  background: var(--bg-elev);\r\n  border-top: 1px solid var(--border);\r\n  box-shadow: var(--shadow);\r\n  border-radius: 16px 16px 0 0;\r\n}\r\n\r\n.rdoc-toc.open {\r\n  display: block;\r\n}\r\n\r\n.rdoc-toc h2 {\r\n  margin: 0 0 0.75rem;\r\n  font-size: 0.95rem;\r\n  letter-spacing: 0.02em;\r\n  text-transform: uppercase;\r\n  color: var(--muted);\r\n}\r\n\r\n.rdoc-toc ol {\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n}\r\n\r\n.rdoc-toc a {\r\n  display: block;\r\n  padding: 0.55rem 0.35rem;\r\n  color: var(--fg);\r\n  text-decoration: none;\r\n  border-radius: 6px;\r\n  font-size: 0.95rem;\r\n}\r\n\r\n.rdoc-toc a:hover,\r\n.rdoc-toc a[aria-current="true"] {\r\n  background: var(--accent-soft);\r\n  color: var(--accent);\r\n}\r\n\r\n.rdoc-toc .l2 {\r\n  padding-left: 1rem;\r\n  font-size: 0.875rem;\r\n  color: var(--muted);\r\n}\r\n\r\n.rdoc-toc-backdrop {\r\n  display: none;\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 45;\r\n  background: rgba(0, 0, 0, 0.35);\r\n}\r\n\r\n.rdoc-toc-backdrop.open {\r\n  display: block;\r\n}\r\n\r\n@media (min-width: 960px) {\r\n  .rdoc-shell {\r\n    grid-template-columns: 14rem minmax(0, var(--measure));\r\n    gap: 2rem;\r\n    padding: 0 var(--pad);\r\n  }\r\n\r\n  .rdoc-toc {\r\n    display: block;\r\n    position: sticky;\r\n    top: 3.5rem;\r\n    inset: auto;\r\n    max-height: calc(100vh - 4.5rem);\r\n    align-self: start;\r\n    margin-top: 1.5rem;\r\n    padding: 0.5rem 0.25rem;\r\n    background: transparent;\r\n    border: 0;\r\n    box-shadow: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  .rdoc-toc-backdrop,\r\n  #btn-toc {\r\n    display: none !important;\r\n  }\r\n}\r\n\r\n/* article \u2014 ~65\u201375ch measure via rem + padding */\r\narticle#rdoc-content {\r\n  max-width: var(--measure);\r\n  margin: 0 auto;\r\n  padding: 1.5rem var(--pad) 5rem;\r\n}\r\n\r\narticle#rdoc-content > *:first-child {\r\n  margin-top: 0;\r\n}\r\n\r\nh1,\r\nh2,\r\nh3,\r\nh4 {\r\n  line-height: 1.25;\r\n  letter-spacing: -0.01em;\r\n  scroll-margin-top: 4rem;\r\n}\r\n\r\nh1 {\r\n  font-size: clamp(1.75rem, 5vw, 2.35rem);\r\n  margin: 0 0 0.75rem;\r\n}\r\n\r\nh2 {\r\n  font-size: clamp(1.35rem, 3.5vw, 1.65rem);\r\n  margin: 2.25rem 0 0.75rem;\r\n  padding-top: 0.5rem;\r\n  border-top: 1px solid var(--border);\r\n}\r\n\r\nh3 {\r\n  font-size: 1.15rem;\r\n  margin: 1.75rem 0 0.5rem;\r\n}\r\n\r\np {\r\n  margin: 0 0 1.05rem;\r\n}\r\n\r\na {\r\n  color: var(--accent);\r\n}\r\n\r\nimg,\r\nsvg {\r\n  max-width: 100%;\r\n  height: auto;\r\n  display: block;\r\n  margin: 1.25rem auto;\r\n}\r\n\r\nfigure {\r\n  margin: 1.5rem 0;\r\n}\r\n\r\nfigcaption {\r\n  margin-top: 0.5rem;\r\n  font-size: 0.875rem;\r\n  color: var(--muted);\r\n  text-align: center;\r\n}\r\n\r\nblockquote {\r\n  margin: 1.25rem 0;\r\n  padding: 0.25rem 0 0.25rem 1rem;\r\n  border-left: 3px solid var(--accent);\r\n  color: var(--muted);\r\n}\r\n\r\nblockquote p:last-child {\r\n  margin-bottom: 0;\r\n}\r\n\r\npre {\r\n  overflow-x: auto;\r\n  padding: 1rem;\r\n  margin: 1.25rem 0;\r\n  background: var(--code-bg);\r\n  border: 1px solid var(--border);\r\n  border-radius: var(--radius);\r\n  font-family: var(--mono);\r\n  font-size: 0.875rem;\r\n  line-height: 1.55;\r\n  -webkit-overflow-scrolling: touch;\r\n}\r\n\r\ncode {\r\n  font-family: var(--mono);\r\n  font-size: 0.9em;\r\n  background: var(--code-bg);\r\n  padding: 0.12em 0.35em;\r\n  border-radius: 4px;\r\n}\r\n\r\npre code {\r\n  background: none;\r\n  padding: 0;\r\n  font-size: inherit;\r\n}\r\n\r\ntable {\r\n  width: 100%;\r\n  border-collapse: collapse;\r\n  margin: 1.25rem 0;\r\n  font-size: 0.95rem;\r\n  display: block;\r\n  overflow-x: auto;\r\n  -webkit-overflow-scrolling: touch;\r\n}\r\n\r\nth,\r\ntd {\r\n  border: 1px solid var(--border);\r\n  padding: 0.55rem 0.7rem;\r\n  text-align: left;\r\n  vertical-align: top;\r\n}\r\n\r\nth {\r\n  background: var(--accent-soft);\r\n}\r\n\r\n.rdoc-callout {\r\n  margin: 1.35rem 0;\r\n  padding: 1rem 1.1rem;\r\n  background: var(--callout);\r\n  border: 1px solid var(--callout-border);\r\n  border-radius: var(--radius);\r\n}\r\n\r\n.rdoc-callout > strong:first-child {\r\n  display: block;\r\n  margin-bottom: 0.35rem;\r\n  color: var(--fg);\r\n}\r\n\r\n.rdoc-formula {\r\n  margin: 1.5rem auto;\r\n  text-align: center;\r\n  overflow-x: auto;\r\n}\r\n\r\nhr {\r\n  border: 0;\r\n  border-top: 1px solid var(--border);\r\n  margin: 2rem 0;\r\n}\r\n\r\n/* footnotes as large tappable refs + popover */\r\n.rdoc-fn-ref {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-width: 1.6rem;\r\n  min-height: 1.6rem;\r\n  margin: 0 0.1rem;\r\n  padding: 0 0.35rem;\r\n  border: 0;\r\n  border-radius: 999px;\r\n  background: var(--accent-soft);\r\n  color: var(--accent);\r\n  font: inherit;\r\n  font-size: 0.75rem;\r\n  font-weight: 700;\r\n  vertical-align: super;\r\n  cursor: pointer;\r\n}\r\n\r\n.rdoc-fn-ref:focus-visible {\r\n  outline: 2px solid var(--accent);\r\n  outline-offset: 2px;\r\n}\r\n\r\n.rdoc-fn-pop {\r\n  position: fixed;\r\n  z-index: 70;\r\n  left: var(--pad);\r\n  right: var(--pad);\r\n  bottom: 1rem;\r\n  max-width: 28rem;\r\n  margin: 0 auto;\r\n  padding: 1rem 1.1rem;\r\n  background: var(--bg-elev);\r\n  color: var(--fg);\r\n  border: 1px solid var(--border);\r\n  border-radius: 12px;\r\n  box-shadow: var(--shadow);\r\n}\r\n\r\n.rdoc-fn-pop[hidden] {\r\n  display: none;\r\n}\r\n\r\n.rdoc-fn-pop header {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 0.5rem;\r\n  margin-bottom: 0.5rem;\r\n  font-size: 0.8rem;\r\n  color: var(--muted);\r\n  text-transform: uppercase;\r\n  letter-spacing: 0.04em;\r\n}\r\n\r\n.rdoc-fn-pop button {\r\n  appearance: none;\r\n  border: 0;\r\n  background: transparent;\r\n  color: var(--fg);\r\n  font: inherit;\r\n  font-size: 1.25rem;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  padding: 0.25rem;\r\n}\r\n\r\n.rdoc-meta {\r\n  margin: 0 0 1.5rem;\r\n  color: var(--muted);\r\n  font-size: 0.9rem;\r\n}\r\n\r\n@media print {\r\n  :root {\r\n    --bg: #fff;\r\n    --fg: #000;\r\n    --muted: #333;\r\n    --border: #ccc;\r\n    --accent: #000;\r\n    --code-bg: #f5f5f5;\r\n  }\r\n\r\n  /* Hide all reader chrome \u2014 never bleed into PDF / paper */\r\n  .rdoc-chrome,\r\n  #rdoc-progress,\r\n  .rdoc-bar,\r\n  .rdoc-toc,\r\n  .rdoc-toc-backdrop,\r\n  .rdoc-fn-pop,\r\n  .rdoc-shell > nav {\r\n    display: none !important;\r\n  }\r\n\r\n  .rdoc-shell {\r\n    display: block !important;\r\n    max-width: none !important;\r\n    margin: 0 !important;\r\n    padding: 0 !important;\r\n    grid-template-columns: none !important;\r\n  }\r\n\r\n  article#rdoc-content {\r\n    max-width: none !important;\r\n    width: 100% !important;\r\n    margin: 0 !important;\r\n    padding: 0 !important;\r\n  }\r\n\r\n  a {\r\n    color: inherit;\r\n    text-decoration: none;\r\n  }\r\n\r\n  pre,\r\n  table,\r\n  .rdoc-callout,\r\n  figure {\r\n    break-inside: avoid;\r\n  }\r\n}\r\n';
var READER_JS = `/*! rdoc runtime <10KB \u2014 TOC, progress, theme, font, footnotes, print */\r
(function () {\r
  var root = document.documentElement;\r
  var article = document.getElementById("rdoc-content");\r
  var progress = document.getElementById("rdoc-progress");\r
  var toc = document.getElementById("rdoc-toc");\r
  var backdrop = document.getElementById("rdoc-toc-backdrop");\r
  var tocList = document.getElementById("rdoc-toc-list");\r
  var pop = document.getElementById("rdoc-fn-pop");\r
  var popBody = document.getElementById("rdoc-fn-body");\r
  var fs = parseFloat(localStorage.getItem("rdoc-fs") || "1.0625");\r
\r
  function applyFs() {\r
    root.style.setProperty("--fs", fs + "rem");\r
    localStorage.setItem("rdoc-fs", String(fs));\r
  }\r
  applyFs();\r
\r
  function setTheme(mode) {\r
    if (mode === "system") root.removeAttribute("data-theme");\r
    else root.setAttribute("data-theme", mode);\r
    localStorage.setItem("rdoc-theme", mode);\r
  }\r
  setTheme(localStorage.getItem("rdoc-theme") || "system");\r
\r
  function slugify(text) {\r
    return text\r
      .toLowerCase()\r
      .trim()\r
      .replace(/[^\\w\\u0400-\\u04FF\\s-]/g, "")\r
      .replace(/\\s+/g, "-");\r
  }\r
\r
  function buildToc() {\r
    if (!article || !tocList) return;\r
    var heads = article.querySelectorAll("h2, h3");\r
    var html = "";\r
    for (var i = 0; i < heads.length; i++) {\r
      var h = heads[i];\r
      if (!h.id) h.id = slugify(h.textContent || "section-" + i);\r
      var cls = h.tagName === "H3" ? ' class="l2"' : "";\r
      html +=\r
        "<li" +\r
        cls +\r
        '><a href="#' +\r
        h.id +\r
        '">' +\r
        (h.textContent || "") +\r
        "</a></li>";\r
    }\r
    tocList.innerHTML = html || "<li><em>\u041D\u0435\u0442 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u043E\u0432</em></li>";\r
  }\r
  buildToc();\r
\r
  function onScroll() {\r
    if (!progress || !article) return;\r
    var rect = article.getBoundingClientRect();\r
    var total = article.scrollHeight - window.innerHeight;\r
    var scrolled = Math.min(Math.max(-rect.top, 0), total || 1);\r
    var pct = total > 0 ? (scrolled / total) * 100 : 100;\r
    progress.style.width = pct + "%";\r
\r
    if (!tocList) return;\r
    var links = tocList.querySelectorAll("a");\r
    var current = null;\r
    var heads = article.querySelectorAll("h2, h3");\r
    for (var i = 0; i < heads.length; i++) {\r
      if (heads[i].getBoundingClientRect().top <= 96) current = heads[i].id;\r
    }\r
    for (var j = 0; j < links.length; j++) {\r
      var a = links[j];\r
      if (a.getAttribute("href") === "#" + current)\r
        a.setAttribute("aria-current", "true");\r
      else a.removeAttribute("aria-current");\r
    }\r
  }\r
  window.addEventListener("scroll", onScroll, { passive: true });\r
  onScroll();\r
\r
  function openToc(open) {\r
    if (!toc || !backdrop) return;\r
    toc.classList.toggle("open", open);\r
    backdrop.classList.toggle("open", open);\r
  }\r
\r
  document.getElementById("btn-toc")?.addEventListener("click", function () {\r
    openToc(!toc.classList.contains("open"));\r
  });\r
  backdrop?.addEventListener("click", function () {\r
    openToc(false);\r
  });\r
  tocList?.addEventListener("click", function (e) {\r
    if (e.target && e.target.tagName === "A") openToc(false);\r
  });\r
\r
  document.getElementById("btn-fs-up")?.addEventListener("click", function () {\r
    fs = Math.min(1.5, +(fs + 0.0625).toFixed(4));\r
    applyFs();\r
  });\r
  document.getElementById("btn-fs-dn")?.addEventListener("click", function () {\r
    fs = Math.max(0.875, +(fs - 0.0625).toFixed(4));\r
    applyFs();\r
  });\r
  document.getElementById("btn-theme")?.addEventListener("click", function () {\r
    var cur = localStorage.getItem("rdoc-theme") || "system";\r
    var next = cur === "system" ? "dark" : cur === "dark" ? "light" : "system";\r
    setTheme(next);\r
  });\r
  document.getElementById("btn-print")?.addEventListener("click", function () {\r
    window.print();\r
  });\r
\r
  function closeFn() {\r
    if (pop) pop.hidden = true;\r
  }\r
  document.getElementById("rdoc-fn-close")?.addEventListener("click", closeFn);\r
  document.addEventListener("keydown", function (e) {\r
    if (e.key === "Escape") {\r
      closeFn();\r
      openToc(false);\r
    }\r
  });\r
\r
  document.addEventListener("click", function (e) {\r
    var t = e.target;\r
    if (!t || !t.classList || !t.classList.contains("rdoc-fn-ref")) return;\r
    e.preventDefault();\r
    var id = t.getAttribute("data-fn");\r
    var note = id && document.getElementById("fn-" + id);\r
    if (!pop || !popBody || !note) return;\r
    popBody.innerHTML = note.innerHTML;\r
    pop.hidden = false;\r
  });\r
})();\r
`;

// src/export.ts
var RDOC_CSP = "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; style-src 'unsafe-inline'; img-src data: blob:; script-src 'unsafe-inline'; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'";
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function normalizeForHash(text) {
  const nfc = text.normalize("NFC");
  const lf = nfc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return lf.trim();
}
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashArticleContent(articleInner) {
  return sha256Hex(normalizeForHash(articleInner));
}
function estimateReading(html) {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
var MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif"
};
function mimeFromPath(p) {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? null;
}
function sanitizeRenderedHtml(html) {
  let out = html;
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<link\b[^>]+href=["']https?:[^"']+["'][^>]*>/gi, "");
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return out;
}
async function wrapRdocDocument(opts) {
  const created = (/* @__PURE__ */ new Date()).toISOString();
  const bodyHtml = sanitizeRenderedHtml(opts.bodyHtml);
  const { words, minutes } = estimateReading(bodyHtml);
  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(opts.title)}</strong></div>
  <div>${escapeHtml(opts.author)} \xB7 ${escapeHtml(created.slice(0, 10))} \xB7 ~${minutes} \u043C\u0438\u043D \u0447\u0442\u0435\u043D\u0438\u044F</div>
</header>
${bodyHtml}`;
  const contentHash = await hashArticleContent(articleInner);
  const manifest = {
    format: "rdoc",
    version: RDOC_VERSION,
    title: opts.title,
    author: opts.author,
    created,
    lang: opts.lang,
    contentHash,
    readingMinutes: minutes,
    wordCount: words,
    description: opts.description || void 0
  };
  const manifestJson = JSON.stringify(manifest, null, 2);
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(manifest.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="${RDOC_CSP}">
<meta name="generator" content="rdoc-obsidian ${RDOC_VERSION}">
<meta name="description" content="${escapeHtml(manifest.description ?? "")}">
<title>${escapeHtml(manifest.title)}</title>
<!--
  RDOC \u2014 Responsive Document (self-contained polyglot).
  Exported from Obsidian. Spec: docs/rfc-0001-rdoc.md
-->
<script type="application/rdoc+json" id="rdoc-manifest">
${manifestJson}
<\/script>
<style>
${READER_CSS}
</style>
</head>
<body>
<div id="rdoc-progress" class="rdoc-chrome" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0447\u0442\u0435\u043D\u0438\u044F"></div>
<header class="rdoc-bar rdoc-chrome">
  <button type="button" id="btn-toc" aria-controls="rdoc-toc">\u2630 \u041E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u0435</button>
  <span class="rdoc-title-chip">${escapeHtml(manifest.title)}</span>
  <span class="spacer"></span>
  <button type="button" id="btn-fs-dn" title="\u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u0448\u0440\u0438\u0444\u0442">A\u2212</button>
  <button type="button" id="btn-fs-up" title="\u0423\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u0448\u0440\u0438\u0444\u0442">A+</button>
  <button type="button" id="btn-theme" title="\u0422\u0435\u043C\u0430">\u0422\u0435\u043C\u0430</button>
  <button type="button" id="btn-print" title="\u041F\u0435\u0447\u0430\u0442\u044C / PDF">PDF</button>
</header>
<div class="rdoc-toc-backdrop rdoc-chrome" id="rdoc-toc-backdrop"></div>
<div class="rdoc-shell">
  <nav class="rdoc-toc rdoc-chrome" id="rdoc-toc" aria-label="\u041E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u0435">
    <h2>\u0421\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435</h2>
    <ol id="rdoc-toc-list"></ol>
  </nav>
  <article id="rdoc-content">
${articleInner}
  </article>
</div>
<aside class="rdoc-fn-pop rdoc-chrome" id="rdoc-fn-pop" hidden role="dialog" aria-label="\u0421\u043D\u043E\u0441\u043A\u0430">
  <header><span>\u0421\u043D\u043E\u0441\u043A\u0430</span><button type="button" id="rdoc-fn-close" aria-label="\u0417\u0430\u043A\u0440\u044B\u0442\u044C">\xD7</button></header>
  <div id="rdoc-fn-body"></div>
</aside>
<script>
${READER_JS}
<\/script>
</body>
</html>
`;
  return { html, manifest };
}

// src/main.ts
var DEFAULT_SETTINGS = {
  author: "Anonymous",
  lang: "ru",
  extension: ".rdoc.html",
  outputFolder: ""
};
var RdocPlugin = class extends import_obsidian.Plugin {
  settings = DEFAULT_SETTINGS;
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("file-down", "Export note to .rdoc", () => {
      void this.exportActiveNote();
    });
    this.addCommand({
      id: "export-note-to-rdoc",
      name: "Export current note to .rdoc",
      callback: () => {
        void this.exportActiveNote();
      }
    });
    this.addCommand({
      id: "export-note-to-rdoc-clipboard-path",
      name: "Export current note to .rdoc (show path)",
      callback: () => {
        void this.exportActiveNote(true);
      }
    });
    this.addSettingTab(new RdocSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async exportActiveNote(announcePath = false) {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new import_obsidian.Notice("\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 Markdown-\u0437\u0430\u043C\u0435\u0442\u043A\u0443 \u0434\u043B\u044F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u0432 .rdoc");
      return;
    }
    try {
      new import_obsidian.Notice("\u0421\u0431\u043E\u0440\u043A\u0430 .rdoc\u2026");
      const markdown = await this.app.vault.read(file);
      const title = file.basename || markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "Untitled";
      const bodyHtml = await this.renderNoteHtml(markdown, file.path);
      const inlined = await this.inlineImages(bodyHtml, file.path);
      const { html, manifest } = await wrapRdocDocument({
        title,
        author: this.settings.author,
        lang: this.settings.lang,
        bodyHtml: inlined
      });
      const outName = `${file.basename}${this.settings.extension}`;
      const folder = (this.settings.outputFolder || "").replace(/^\/+|\/+$/g, "");
      const noteDir = file.parent?.path && file.parent.path !== "/" ? file.parent.path : "";
      const outPath = folder ? `${folder}/${outName}` : noteDir ? `${noteDir}/${outName}` : outName;
      if (folder) {
        const parts = folder.split("/");
        let acc = "";
        for (const part of parts) {
          acc = acc ? `${acc}/${part}` : part;
          if (!await this.app.vault.adapter.exists(acc)) {
            await this.app.vault.createFolder(acc);
          }
        }
      }
      const existing = this.app.vault.getAbstractFileByPath(outPath);
      if (existing instanceof import_obsidian.TFile) {
        await this.app.vault.modify(existing, html);
      } else {
        await this.app.vault.create(outPath, html);
      }
      const msg = announcePath ? `\u2713 .rdoc: ${outPath} (${manifest.wordCount} \u0441\u043B\u043E\u0432, SHA ${manifest.contentHash.slice(0, 8)}\u2026)` : `\u2713 \u042D\u043A\u0441\u043F\u043E\u0440\u0442: ${outName}`;
      new import_obsidian.Notice(msg, 6e3);
    } catch (err) {
      console.error(err);
      new import_obsidian.Notice(
        `\u041E\u0448\u0438\u0431\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 .rdoc: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  async renderNoteHtml(markdown, sourcePath) {
    const host = document.createElement("div");
    host.style.display = "none";
    document.body.appendChild(host);
    const component = new import_obsidian.Component();
    component.load();
    try {
      await import_obsidian.MarkdownRenderer.render(
        this.app,
        markdown,
        host,
        sourcePath,
        component
      );
      return sanitizeRenderedHtml(host.innerHTML);
    } finally {
      component.unload();
      host.remove();
    }
  }
  async inlineImages(html, sourcePath) {
    const container = document.createElement("div");
    container.innerHTML = html;
    const imgs = Array.from(container.querySelectorAll("img"));
    for (const img of imgs) {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) continue;
      if (/^https?:/i.test(src) || src.startsWith("//")) {
        img.remove();
        continue;
      }
      let linkpath = src;
      try {
        linkpath = decodeURIComponent(src);
      } catch {
      }
      linkpath = linkpath.replace(/^app:\/\/[^/]+\//, "").replace(/^\/+/, "");
      const dest = this.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath) || this.app.vault.getAbstractFileByPath(linkpath);
      if (!(dest instanceof import_obsidian.TFile)) {
        const base = linkpath.split("/").pop() ?? linkpath;
        const alt = this.app.metadataCache.getFirstLinkpathDest(base, sourcePath);
        if (!(alt instanceof import_obsidian.TFile)) {
          img.removeAttribute("src");
          continue;
        }
        await this.applyBinary(img, alt);
        continue;
      }
      await this.applyBinary(img, dest);
    }
    return container.innerHTML;
  }
  async applyBinary(img, file) {
    const mime = mimeFromPath(file.path) ?? "application/octet-stream";
    const buf = await this.app.vault.readBinary(file);
    const b64 = arrayBufferToBase64(buf);
    img.setAttribute("src", `data:${mime};base64,${b64}`);
  }
};
var RdocSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "RDOC export" });
    new import_obsidian.Setting(containerEl).setName("Author").setDesc("\u041F\u043E\u043B\u0435 author \u0432 \u043C\u0430\u043D\u0438\u0444\u0435\u0441\u0442\u0435").addText(
      (t) => t.setValue(this.plugin.settings.author).onChange(async (v) => {
        this.plugin.settings.author = v || "Anonymous";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Language").setDesc("BCP-47 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 ru, en)").addText(
      (t) => t.setValue(this.plugin.settings.lang).onChange(async (v) => {
        this.plugin.settings.lang = v || "ru";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Extension").setDesc(".rdoc.html \u2014 \u0431\u0435\u0437 \u0430\u0441\u0441\u043E\u0446\u0438\u0430\u0446\u0438\u0438 \u041E\u0421; .rdoc \u2014 \u043F\u043E\u0441\u043B\u0435 rdoc associate").addDropdown(
      (d) => d.addOption(".rdoc.html", ".rdoc.html").addOption(".rdoc", ".rdoc").setValue(this.plugin.settings.extension).onChange(async (v) => {
        this.plugin.settings.extension = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Output folder").setDesc("\u041F\u0443\u0441\u0442\u043E = \u0440\u044F\u0434\u043E\u043C \u0441 \u0437\u0430\u043C\u0435\u0442\u043A\u043E\u0439; \u0438\u043D\u0430\u0447\u0435 \u043F\u0430\u043F\u043A\u0430 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043A\u043E\u0440\u043D\u044F vault").addText(
      (t) => t.setPlaceholder("exports").setValue(this.plugin.settings.outputFolder).onChange(async (v) => {
        this.plugin.settings.outputFolder = v.trim();
        await this.plugin.saveSettings();
      })
    );
  }
};
