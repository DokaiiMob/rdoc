import { READER_CSS, READER_JS, RDOC_VERSION } from "./assets";

export interface RdocManifest {
  format: "rdoc";
  version: string;
  title: string;
  author: string;
  created: string;
  lang: string;
  contentHash: string;
  readingMinutes: number;
  wordCount: number;
  description?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function estimateReading(html: string): {
  words: number;
  minutes: number;
} {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export function mimeFromPath(p: string): string | null {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? null;
}

/** Strip Obsidian-only chrome and external script/link tags from rendered HTML. */
export function sanitizeRenderedHtml(html: string): string {
  let out = html;
  // Remove external scripts/styles if any leaked in.
  out = out.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, "");
  out = out.replace(/<link\b[^>]+href=["']https?:[^"']+["'][^>]*>/gi, "");
  // Drop internal-anchor edit buttons etc. if present.
  out = out.replace(/<span class="[^"]*internal-embed[^"]*"[^>]*>[\s\S]*?<\/span>/gi, (m) => m);
  return out;
}

export async function wrapRdocDocument(opts: {
  title: string;
  author: string;
  lang: string;
  description?: string;
  bodyHtml: string;
}): Promise<{ html: string; manifest: RdocManifest }> {
  const created = new Date().toISOString();
  const { words, minutes } = estimateReading(opts.bodyHtml);
  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(opts.title)}</strong></div>
  <div>${escapeHtml(opts.author)} · ${escapeHtml(created.slice(0, 10))} · ~${minutes} мин чтения</div>
</header>
${opts.bodyHtml}`;

  const contentHash = await sha256Hex(articleInner.trim());
  const manifest: RdocManifest = {
    format: "rdoc",
    version: RDOC_VERSION,
    title: opts.title,
    author: opts.author,
    created,
    lang: opts.lang,
    contentHash,
    readingMinutes: minutes,
    wordCount: words,
    description: opts.description || undefined,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(manifest.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="generator" content="rdoc-obsidian ${RDOC_VERSION}">
<meta name="description" content="${escapeHtml(manifest.description ?? "")}">
<title>${escapeHtml(manifest.title)}</title>
<!--
  RDOC — Responsive Document (self-contained polyglot).
  Exported from Obsidian. Spec: docs/rfc-0001-rdoc.md
-->
<script type="application/rdoc+json" id="rdoc-manifest">
${manifestJson}
</script>
<style>
${READER_CSS}
</style>
</head>
<body>
<div id="rdoc-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Прогресс чтения"></div>
<header class="rdoc-bar">
  <button type="button" id="btn-toc" aria-controls="rdoc-toc">☰ Оглавление</button>
  <span class="rdoc-title-chip">${escapeHtml(manifest.title)}</span>
  <span class="spacer"></span>
  <button type="button" id="btn-fs-dn" title="Уменьшить шрифт">A−</button>
  <button type="button" id="btn-fs-up" title="Увеличить шрифт">A+</button>
  <button type="button" id="btn-theme" title="Тема">Тема</button>
  <button type="button" id="btn-print" title="Печать / PDF">PDF</button>
</header>
<div class="rdoc-toc-backdrop" id="rdoc-toc-backdrop"></div>
<div class="rdoc-shell">
  <nav class="rdoc-toc" id="rdoc-toc" aria-label="Оглавление">
    <h2>Содержание</h2>
    <ol id="rdoc-toc-list"></ol>
  </nav>
  <article id="rdoc-content">
${articleInner}
  </article>
</div>
<aside class="rdoc-fn-pop" id="rdoc-fn-pop" hidden role="dialog" aria-label="Сноска">
  <header><span>Сноска</span><button type="button" id="rdoc-fn-close" aria-label="Закрыть">×</button></header>
  <div id="rdoc-fn-body"></div>
</aside>
<script>
${READER_JS}
</script>
</body>
</html>
`;

  return { html, manifest };
}
