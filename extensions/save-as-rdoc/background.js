/**
 * MV3 service worker: extract page → build RDOC polyglot → download.
 */

const RDOC_VERSION = "1.1.0";
const RDOC_CSP =
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; " +
  "style-src 'unsafe-inline'; img-src data: blob:; script-src 'unsafe-inline'; " +
  "connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'";

const READER_CSS = `
:root { --fg:#1a1a1a; --bg:#f7fff9; --muted:#5a6b63; --accent:#0b6e4f; --measure:42rem; }
@media (prefers-color-scheme: dark) {
  :root { --fg:#e8f0ec; --bg:#0f1613; --muted:#9aafa4; }
}
* { box-sizing: border-box; }
html { color-scheme: light dark; }
body {
  margin: 0;
  font: 18px/1.65 system-ui, -apple-system, Segoe UI, sans-serif;
  color: var(--fg);
  background: var(--bg);
}
.rdoc-meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
.rdoc-meta strong { color: var(--fg); font-size: 1.35rem; display: block; margin-bottom: 0.35rem; }
#rdoc-content {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}
#rdoc-content h1, #rdoc-content h2, #rdoc-content h3 { line-height: 1.25; }
#rdoc-content img { max-width: 100%; height: auto; }
#rdoc-content a { color: var(--accent); }
#rdoc-content pre, #rdoc-content code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
}
#rdoc-content pre {
  overflow: auto;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--muted) 12%, transparent);
  border-radius: 6px;
}
@media print {
  body { background: white; color: black; }
}
`.trim();

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeForHash(text) {
  const nfc = text.normalize("NFC");
  return nfc.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function estimateReading(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  const minutes = Math.max(1, Math.round(words / 230));
  return { words, minutes };
}

function safeFilename(title) {
  const base = title
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || "page"}.rdoc.html`;
}

async function buildRdoc(page) {
  const created = new Date().toISOString();
  const title = page.title || "Untitled";
  const author = page.author || "Anonymous";
  const lang = page.lang || "en";
  const { words, minutes } = estimateReading(page.bodyHtml || "");
  const readLabel = `${minutes} min read`;

  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(title)}</strong></div>
  <div>${escapeHtml(author)} · ${escapeHtml(created.slice(0, 10))} · ~${readLabel}</div>
</header>
${page.bodyHtml || ""}`;

  const contentHash = await sha256Hex(normalizeForHash(articleInner));

  const manifest = {
    format: "rdoc",
    version: RDOC_VERSION,
    title,
    author,
    created,
    lang,
    contentHash,
    readingMinutes: minutes,
    wordCount: words,
    description: page.description || undefined,
    profile: "article",
    canonicalUrl: page.canonicalUrl || undefined,
    generator: "save-as-rdoc-extension/0.1.0",
  };

  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="${RDOC_CSP}">
<meta name="generator" content="rdoc-extension ${RDOC_VERSION}">
<meta name="description" content="${escapeHtml(manifest.description ?? "")}">
<title>${escapeHtml(title)}</title>
<!--
  RDOC — Responsive Document (self-contained polyglot).
  Built by the Save as .rdoc browser extension (MVP).
-->
<script type="application/rdoc+json" id="rdoc-manifest">
${JSON.stringify(manifest, null, 2)}
</script>
<style>
${READER_CSS}
</style>
</head>
<body>
<article id="rdoc-content">
${articleInner}
</article>
</body>
</html>
`;

  return { html, filename: safeFilename(title), contentHash };
}

async function extractFromTab(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
  if (!result?.bodyHtml) {
    throw new Error("Could not extract article content from this page");
  }
  return result;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "save-as-rdoc") return;
  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");
    if (tab.url && /^(chrome|edge|about|devtools):/i.test(tab.url)) {
      throw new Error("Cannot run on browser internal pages");
    }
    const page = await extractFromTab(tab.id);
    const { html, filename, contentHash } = await buildRdoc(page);
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await chrome.downloads.download({
      url,
      filename,
      saveAs: true,
    });
    return { ok: true, filename, contentHash };
  })()
    .then(sendResponse)
    .catch((err) =>
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  return true;
});
