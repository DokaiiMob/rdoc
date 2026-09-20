import * as MarkedNS from "marked";
import {
  escapeHtml,
  estimateReading,
  guessTitle,
  processCallouts,
  processFootnotes,
} from "../../src/md-ext";
import {
  RDOC_CSP,
  normalizeForHash,
  sanitizeArticleHtml,
} from "../../src/normalize";
import { RDOC_VERSION } from "../../src/types";
// esbuild text loaders
import readerCss from "../../src/template/reader.css";
import readerJs from "../../src/template/runtime.js";

const { marked } = MarkedNS;
marked.setOptions({ gfm: true, breaks: false });

async function hashArticleContent(articleInner: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeForHash(articleInner));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface BrowserBuildResult {
  html: string;
  title: string;
  contentHash: string;
  bytes: number;
  readingMinutes: number;
  wordCount: number;
}

/** Compile Markdown → .rdoc.html entirely in the browser (no network). */
export async function compileMarkdownInBrowser(
  source: string,
  opts: { filename?: string; author?: string; lang?: string } = {},
): Promise<BrowserBuildResult> {
  const title = guessTitle(source, opts.filename?.replace(/\.md$/i, "") || "document");
  const author = opts.author ?? "Anonymous";
  const lang = opts.lang ?? "en";

  let md = processCallouts(source);
  const { markdown, footnotesHtml } = processFootnotes(md);
  let bodyHtml = await marked.parse(markdown);
  bodyHtml += footnotesHtml;
  bodyHtml = sanitizeArticleHtml(bodyHtml);

  // Drop remote images in playground (keep data/svg only)
  bodyHtml = bodyHtml.replace(
    /<img\b[^>]*src=["'](https?:|\/\/)[^"']*["'][^>]*>/gi,
    "<!-- remote image omitted -->",
  );

  const created = new Date().toISOString();
  const { words, minutes } = estimateReading(bodyHtml);
  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(title)}</strong></div>
  <div>${escapeHtml(author)} · ${escapeHtml(created.slice(0, 10))} · ~${minutes} min read</div>
</header>
${bodyHtml}`;

  const contentHash = await hashArticleContent(articleInner);
  const manifest = {
    format: "rdoc" as const,
    version: RDOC_VERSION,
    title,
    author,
    created,
    lang,
    contentHash,
    readingMinutes: minutes,
    wordCount: words,
  };
  const manifestJson = JSON.stringify(manifest, null, 2);

  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="${RDOC_CSP}">
<meta name="generator" content="rdoc-playground ${RDOC_VERSION}">
<title>${escapeHtml(title)}</title>
<script type="application/rdoc+json" id="rdoc-manifest">
${manifestJson}
</script>
<style>
${readerCss}
</style>
</head>
<body>
<div id="rdoc-progress" class="rdoc-chrome" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Reading progress"></div>
<header class="rdoc-bar rdoc-chrome">
  <button type="button" id="btn-toc" aria-controls="rdoc-toc">☰ Contents</button>
  <span class="rdoc-title-chip">${escapeHtml(title)}</span>
  <span class="spacer"></span>
  <button type="button" id="btn-fs-dn" title="Smaller">A−</button>
  <button type="button" id="btn-fs-up" title="Larger">A+</button>
  <button type="button" id="btn-theme" title="Theme">Theme</button>
  <button type="button" id="btn-print" title="Print / PDF">PDF</button>
</header>
<div class="rdoc-toc-backdrop rdoc-chrome" id="rdoc-toc-backdrop"></div>
<div class="rdoc-shell">
  <nav class="rdoc-toc rdoc-chrome" id="rdoc-toc" aria-label="Table of contents">
    <h2>Contents</h2>
    <ol id="rdoc-toc-list"></ol>
  </nav>
  <article id="rdoc-content">
${articleInner}
  </article>
</div>
<aside class="rdoc-fn-pop rdoc-chrome" id="rdoc-fn-pop" hidden role="dialog" aria-label="Footnote">
  <header><span>Footnote</span><button type="button" id="rdoc-fn-close" aria-label="Close">×</button></header>
  <div id="rdoc-fn-body"></div>
</aside>
<script>
${readerJs}
</script>
</body>
</html>
`;

  return {
    html,
    title,
    contentHash,
    bytes: new TextEncoder().encode(html).length,
    readingMinutes: minutes,
    wordCount: words,
  };
}
