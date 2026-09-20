import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { finished } from "node:stream/promises";
import { marked } from "marked";
import type { BuildOptions, RdocManifest, RdocProfile } from "./types.js";
import { RDOC_VERSION } from "./types.js";
import { estimateReading, hashArticleContent } from "./validator.js";
import {
  RDOC_CSP,
  RDOC_CSP_REPORT_ONLY,
  sanitizeArticleHtml,
} from "./normalize.js";
import {
  escapeHtml,
  guessTitle,
  processCallouts,
  processDefinitionLists,
  processFootnotes,
  processTaskLists,
} from "./md-ext.js";
import { extractFrontMatter } from "./front-matter.js";
import { inlineLocalImages } from "./images.js";
import { highlightHtml, PRISM_CSS } from "./highlight.js";
import { processMath, KATEX_CSS } from "./math.js";
import { processDiagrams } from "./diagrams.js";
import { applyCitations, loadBibFile } from "./citations.js";
import {
  extractArticleFromHtml,
  extractHtmlTitle,
  isHtmlInput,
} from "./html-input.js";
import { loadRdocConfig } from "./config.js";

export { processCallouts, processFootnotes } from "./md-ext.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, "template");

async function loadTemplateAssets(): Promise<{ css: string; js: string }> {
  const [css, js] = await Promise.all([
    readFile(path.join(TEMPLATE_DIR, "reader.css"), "utf8"),
    readFile(path.join(TEMPLATE_DIR, "runtime.js"), "utf8"),
  ]);
  return { css, js };
}

marked.setOptions({
  gfm: true,
  breaks: false,
});

function stripExternalResources(html: string): void {
  if (/<script\b[^>]+src=/i.test(html)) {
    throw new Error("External <script src> is forbidden in .rdoc.");
  }
  if (/<link\b[^>]+href=["']https?:/i.test(html)) {
    throw new Error("External stylesheet/link is forbidden in .rdoc.");
  }
}

async function writeStreamUtf8(filePath: string, content: string): Promise<number> {
  const stream = createWriteStream(filePath, { encoding: "utf8" });
  const chunk = 64 * 1024;
  for (let i = 0; i < content.length; i += chunk) {
    const slice = content.slice(i, i + chunk);
    if (!stream.write(slice)) {
      await new Promise<void>((resolve) => stream.once("drain", resolve));
    }
  }
  stream.end();
  await finished(stream);
  return Buffer.byteLength(content, "utf8");
}

function wrapDocument(opts: {
  manifest: RdocManifest;
  articleInner: string;
  css: string;
  js: string;
  extraCss?: string;
  cspReport?: boolean;
}): string {
  const { manifest, articleInner, css, js, extraCss, cspReport } = opts;
  const manifestJson = JSON.stringify(manifest, null, 2);
  const cspReportMeta = cspReport
    ? `\n<meta http-equiv="Content-Security-Policy-Report-Only" content="${RDOC_CSP_REPORT_ONLY}">`
    : "";
  const allCss = extraCss ? `${css}\n${extraCss}` : css;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(manifest.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="${RDOC_CSP}">${cspReportMeta}
<meta name="generator" content="rdoc ${RDOC_VERSION}">
<meta name="description" content="${escapeHtml(manifest.description ?? "")}">
<title>${escapeHtml(manifest.title)}</title>
<!--
  RDOC — Responsive Document (self-contained polyglot).
  Open in any browser. No network required.
  Spec: format=rdoc version=${manifest.version}
-->
<script type="application/rdoc+json" id="rdoc-manifest">
${manifestJson}
</script>
<style>
${allCss}
</style>
</head>
<body>
<div id="rdoc-progress" class="rdoc-chrome" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Прогресс чтения"></div>
<header class="rdoc-bar rdoc-chrome">
  <button type="button" id="btn-toc" aria-controls="rdoc-toc">☰ TOC</button>
  <span class="rdoc-title-chip">${escapeHtml(manifest.title)}</span>
  <span class="spacer"></span>
  <button type="button" id="btn-fs-dn" title="Smaller font">A−</button>
  <button type="button" id="btn-fs-up" title="Larger font">A+</button>
  <button type="button" id="btn-serif" title="Serif reading font">Serif</button>
  <button type="button" id="btn-theme" title="Theme">Theme</button>
  <button type="button" id="btn-copy" title="Copy plain text">Copy</button>
  <button type="button" id="btn-cite" title="Copy citation">Cite</button>
  <button type="button" id="btn-print-preset" title="Print page size">A4</button>
  <button type="button" id="btn-more" title="More options" aria-haspopup="true">⋯</button>
  <button type="button" id="btn-print" title="Print / PDF">PDF</button>
</header>
<div class="rdoc-toc-backdrop rdoc-chrome" id="rdoc-toc-backdrop"></div>
<div class="rdoc-shell">
  <nav class="rdoc-toc rdoc-chrome" id="rdoc-toc" aria-label="Оглавление">
    <h2>Содержание</h2>
    <ol id="rdoc-toc-list"></ol>
  </nav>
  <article id="rdoc-content">
${articleInner}
  </article>
</div>
<aside class="rdoc-fn-pop rdoc-chrome" id="rdoc-fn-pop" hidden role="dialog" aria-label="Сноска">
  <header><span>Сноска</span><button type="button" id="rdoc-fn-close" aria-label="Закрыть">×</button></header>
  <div id="rdoc-fn-body"></div>
</aside>
<script>
${js}
</script>
</body>
</html>
`;
}

function asProfile(v: unknown): RdocProfile | undefined {
  if (v === "article" || v === "slides" || v === "contract" || v === "paper") {
    return v;
  }
  return undefined;
}

export async function buildRdoc(options: BuildOptions): Promise<{
  outputPath: string;
  manifest: RdocManifest;
  bytes: number;
  warnings: string[];
}> {
  const inputPath = path.resolve(options.inputPath);
  const outputPath = path.resolve(options.outputPath);
  const baseDir = path.dirname(inputPath);
  const assetsDir = options.assetsDir
    ? path.resolve(options.assetsDir)
    : baseDir;
  const failOnExternal = options.failOnExternal !== false;
  const doHighlight = options.highlight !== false;
  const doMath = options.math !== false;
  const doDiagrams = options.diagrams !== false;
  const warnings: string[] = [];

  const source = await readFile(inputPath, "utf8");
  const extraCssParts: string[] = [];
  const { config } = await loadRdocConfig(baseDir);

  let bodyHtml: string;
  // Priority: CLI BuildOptions > front-matter > rdoc.config.json > defaults
  let title: string;
  let author = options.author ?? config.author ?? "Anonymous";
  let lang = options.lang ?? config.lang ?? "en";
  let description = options.description ?? config.description ?? "";
  let tags = options.tags?.length
    ? [...options.tags]
    : config.tags
      ? [...config.tags]
      : undefined;
  let profile = options.profile ?? config.profile;
  let license = options.license ?? config.license;
  let rights = options.rights ?? config.rights;
  let canonicalUrl = options.canonicalUrl ?? config.canonicalUrl;
  let themeAccent = options.themeAccent ?? config.themeAccent;

  if (isHtmlInput(inputPath)) {
    title =
      options.title ??
      extractHtmlTitle(source, path.basename(inputPath, path.extname(inputPath)));
    bodyHtml = extractArticleFromHtml(source, {
      readability: Boolean(options.readability),
    });
    bodyHtml = await inlineLocalImages(bodyHtml, { assetsDir, failOnExternal });
  } else {
    const { meta, body: withoutFm } = extractFrontMatter(source);

    // Front-matter overrides config defaults; CLI options still win when set.
    title =
      options.title ??
      (typeof meta.title === "string" ? meta.title : undefined) ??
      guessTitle(withoutFm, path.basename(inputPath));
    if (!options.author && typeof meta.author === "string") author = meta.author;
    if (!options.lang && typeof meta.lang === "string") lang = meta.lang;
    if (!options.description && typeof meta.description === "string") {
      description = meta.description;
    }
    if (!options.tags?.length && Array.isArray(meta.tags)) {
      tags = meta.tags.map(String);
    }
    if (!options.profile && meta.profile) {
      profile = asProfile(meta.profile) ?? profile;
    }
    if (!options.license && typeof meta.license === "string") license = meta.license;
    if (!options.rights && typeof meta.rights === "string") rights = meta.rights;
    if (!options.canonicalUrl && typeof meta.canonicalUrl === "string") {
      canonicalUrl = meta.canonicalUrl;
    }
    if (!options.themeAccent && typeof meta.themeAccent === "string") {
      themeAccent = meta.themeAccent;
    }

    let md = withoutFm;
    md = processTaskLists(md);
    md = processCallouts(md);
    md = processDefinitionLists(md);

    if (doDiagrams) {
      const diag = await processDiagrams(md);
      md = diag.markdown;
      warnings.push(...diag.warnings);
    }

    if (doMath) {
      const math = processMath(md);
      md = math.markdown;
      if (math.used) extraCssParts.push(KATEX_CSS);
    }

    let bibliographyHtml = "";
    if (options.bibliography) {
      const bib = await loadBibFile(path.resolve(options.bibliography));
      const cites = applyCitations(md, bib);
      md = cites.markdown;
      bibliographyHtml = cites.bibliographyHtml;
      for (const miss of cites.missing) {
        warnings.push(`Unknown citation key: ${miss}`);
      }
    }

    const { markdown, footnotesHtml } = processFootnotes(md);
    md = markdown;

    bodyHtml = await marked.parse(md);

    if (doHighlight) {
      const hl = highlightHtml(bodyHtml);
      bodyHtml = hl.html;
      if (hl.used) extraCssParts.push(PRISM_CSS);
    }

    bodyHtml = await inlineLocalImages(bodyHtml, { assetsDir, failOnExternal });
    bodyHtml += footnotesHtml + bibliographyHtml;
    bodyHtml = sanitizeArticleHtml(bodyHtml);
  }

  stripExternalResources(bodyHtml);

  const created =
    options.created ||
    (process.env.SOURCE_DATE_EPOCH
      ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
      : new Date().toISOString());
  const { words, minutes } = estimateReading(bodyHtml);
  const readLabel =
    lang.startsWith("ru") ? `${minutes} мин чтения` : `${minutes} min read`;

  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(title)}</strong></div>
  <div>${escapeHtml(author)} · ${escapeHtml(created.slice(0, 10))} · ~${readLabel}</div>
</header>
${bodyHtml}`;

  const contentHash = hashArticleContent(articleInner);

  const manifest: RdocManifest = {
    format: "rdoc",
    version: RDOC_VERSION,
    title,
    author,
    created,
    lang,
    contentHash,
    readingMinutes: minutes,
    wordCount: words,
    description: description || undefined,
    profile,
    canonicalUrl: canonicalUrl || undefined,
    license: license || undefined,
    rights: rights || undefined,
    themeAccent: themeAccent || undefined,
    tags: tags?.length ? tags : undefined,
  };

  const { css, js } = await loadTemplateAssets();
  const document = wrapDocument({
    manifest,
    articleInner,
    css,
    js,
    extraCss: extraCssParts.length ? extraCssParts.join("\n") : undefined,
    cspReport: Boolean(options.cspReport),
  });

  const bytes = await writeStreamUtf8(outputPath, document);
  return {
    outputPath,
    manifest,
    bytes,
    warnings,
  };
}

export function getTemplateDir(): string {
  return TEMPLATE_DIR;
}
