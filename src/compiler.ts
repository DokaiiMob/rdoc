import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import type { BuildOptions, RdocManifest } from "./types.js";
import { RDOC_VERSION } from "./types.js";
import { estimateReading, sha256Hex } from "./validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, "template");

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

marked.setOptions({
  gfm: true,
  breaks: false,
});

async function loadTemplateAssets(): Promise<{ css: string; js: string }> {
  const [css, js] = await Promise.all([
    readFile(path.join(TEMPLATE_DIR, "reader.css"), "utf8"),
    readFile(path.join(TEMPLATE_DIR, "runtime.js"), "utf8"),
  ]);
  return { css, js };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Parse [^id] refs and [^id]: definitions into popover-friendly HTML. */
export function processFootnotes(md: string): {
  markdown: string;
  footnotesHtml: string;
} {
  const defs = new Map<string, string>();
  let body = md.replace(
    /^\[\^([^\]]+)\]:\s*(.+)$/gm,
    (_m, id: string, text: string) => {
      defs.set(id, text.trim());
      return "";
    },
  );

  body = body.replace(/\[\^([^\]]+)\]/g, (_m, id: string) => {
    return `<button type="button" class="rdoc-fn-ref" data-fn="${escapeHtml(id)}" aria-label="Сноска ${escapeHtml(id)}">${escapeHtml(id)}</button>`;
  });

  let footnotesHtml = "";
  if (defs.size > 0) {
    const items = [...defs.entries()]
      .map(
        ([id, text]) =>
          `<aside id="fn-${escapeHtml(id)}" hidden data-fn-def>${text}</aside>`,
      )
      .join("\n");
    footnotesHtml = `\n<div class="rdoc-footnotes" hidden>\n${items}\n</div>`;
  }

  return { markdown: body, footnotesHtml };
}

/** Callouts: ::: note ... ::: */
export function processCallouts(md: string): string {
  return md.replace(
    /^:::\s*(\w+)\s*\n([\s\S]*?)^:::/gm,
    (_m, kind: string, body: string) => {
      const label =
        kind === "warning"
          ? "Важно"
          : kind === "tip"
            ? "Совет"
            : kind === "info"
              ? "Инфо"
              : kind;
      return `<aside class="rdoc-callout" data-kind="${escapeHtml(kind)}"><strong>${escapeHtml(label)}</strong>\n\n${body.trim()}\n</aside>`;
    },
  );
}

async function inlineLocalImages(
  html: string,
  baseDir: string,
): Promise<string> {
  const imgRe = /<img\b([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;
  const parts: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = imgRe.exec(html)) !== null) {
    parts.push(html.slice(last, match.index));
    const before = match[1];
    const src = match[2];
    const after = match[3];

    if (
      src.startsWith("data:") ||
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("//")
    ) {
      if (/^https?:/i.test(src) || src.startsWith("//")) {
        throw new Error(
          `Внешние изображения запрещены в .rdoc: ${src}. Встройте локальный файл.`,
        );
      }
      parts.push(match[0]);
    } else {
      const abs = path.resolve(baseDir, src);
      const ext = path.extname(abs).toLowerCase();
      const mime = MIME[ext];
      if (!mime) {
        throw new Error(`Неподдерживаемый тип изображения: ${src}`);
      }
      const buf = await readFile(abs);
      const b64 = buf.toString("base64");
      parts.push(`<img${before}src="data:${mime};base64,${b64}"${after}>`);
    }
    last = match.index + match[0].length;
  }
  parts.push(html.slice(last));
  return parts.join("");
}

function stripExternalResources(html: string): void {
  if (/<script\b[^>]+src=/i.test(html)) {
    throw new Error("Внешние <script src> запрещены в .rdoc.");
  }
  if (/<link\b[^>]+href=["']https?:/i.test(html)) {
    throw new Error("Внешние stylesheet/link запрещены в .rdoc.");
  }
}

function guessTitle(md: string, fallback: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return (m?.[1] ?? fallback).trim();
}

function wrapDocument(opts: {
  manifest: RdocManifest;
  articleInner: string;
  css: string;
  js: string;
}): string {
  const { manifest, articleInner, css, js } = opts;
  const manifestJson = JSON.stringify(manifest, null, 2);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(manifest.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
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
${css}
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
${js}
</script>
</body>
</html>
`;
}

export async function buildRdoc(options: BuildOptions): Promise<{
  outputPath: string;
  manifest: RdocManifest;
  bytes: number;
}> {
  const inputPath = path.resolve(options.inputPath);
  const outputPath = path.resolve(options.outputPath);
  const baseDir = path.dirname(inputPath);

  const source = await readFile(inputPath, "utf8");
  const title = options.title ?? guessTitle(source, path.basename(inputPath));
  const author = options.author ?? "Anonymous";
  const lang = options.lang ?? "ru";
  const description = options.description ?? "";

  let md = processCallouts(source);
  const { markdown, footnotesHtml } = processFootnotes(md);
  md = markdown;

  let bodyHtml = await marked.parse(md);
  bodyHtml = await inlineLocalImages(bodyHtml, baseDir);
  bodyHtml += footnotesHtml;
  stripExternalResources(bodyHtml);

  const created = new Date().toISOString();
  const { words, minutes } = estimateReading(bodyHtml);

  // Article inner HTML is what we hash (meta header + body).
  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(title)}</strong></div>
  <div>${escapeHtml(author)} · ${escapeHtml(created.slice(0, 10))} · ~${minutes} мин чтения</div>
</header>
${bodyHtml}`;

  const contentHash = sha256Hex(articleInner.trim());

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
  };

  const { css, js } = await loadTemplateAssets();
  const document = wrapDocument({
    manifest,
    articleInner,
    css,
    js,
  });

  await writeFile(outputPath, document, "utf8");
  return {
    outputPath,
    manifest,
    bytes: Buffer.byteLength(document, "utf8"),
  };
}

export function getTemplateDir(): string {
  return TEMPLATE_DIR;
}
