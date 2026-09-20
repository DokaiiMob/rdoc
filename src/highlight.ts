/**
 * Offline syntax highlighting via Prism (compile-time).
 * Only languages used in the document are loaded; CSS is inlined once.
 * Tradeoff: Prism core + a few grammars add ~30–80 KB to the output when
 * fenced code blocks are present. Disable with --no-highlight.
 */

import Prism from "prismjs";
// Common languages (side-effect register)
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-rust.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-yaml.js";
import "prismjs/components/prism-sql.js";

/** Minimal Prism theme CSS (offline, no CDN). */
export const PRISM_CSS = `/* Prism (rdoc offline subset) */
code[class*="language-"], pre[class*="language-"] {
  color: #24292e; text-shadow: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em; direction: ltr; text-align: left; white-space: pre; word-spacing: normal;
  word-break: normal; line-height: 1.5; tab-size: 2; hyphens: none;
}
pre[class*="language-"] { padding: 1em; margin: 0.5em 0; overflow: auto; background: #f6f8fa; border-radius: 6px; }
:root[data-theme="dark"] code[class*="language-"],
:root[data-theme="dark"] pre[class*="language-"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) code[class*="language-"],
  :root:not([data-theme="light"]) pre[class*="language-"] { color: #e6edf3; }
  :root:not([data-theme="light"]) pre[class*="language-"] { background: #161b22; }
}
.token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6a737d; }
.token.punctuation { color: #24292e; }
.token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #005cc5; }
.token.selector, .token.attr-name, .token.string, .token.char, .token.builtin { color: #032f62; }
.token.operator, .token.entity, .token.url { color: #d73a49; }
.token.atrule, .token.attr-value, .token.keyword { color: #d73a49; }
.token.function, .token.class-name { color: #6f42c1; }
.token.regex, .token.important, .token.variable { color: #e36209; }
`;

const LANG_ALIAS: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  md: "markdown",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  py: "python",
  rs: "rust",
  csharp: "clike",
  "c++": "cpp",
  hpp: "cpp",
  html: "markup",
  xml: "markup",
  svg: "markup",
};

export function normalizeLang(lang: string | undefined): string | undefined {
  if (!lang) return undefined;
  const key = lang.trim().toLowerCase();
  return LANG_ALIAS[key] ?? key;
}

export function highlightCode(code: string, lang?: string): string {
  const normalized = normalizeLang(lang);
  if (normalized && Prism.languages[normalized]) {
    return Prism.highlight(code, Prism.languages[normalized], normalized);
  }
  return Prism.util.encode(code) as string;
}

/** Highlight all <pre><code class="language-…"> blocks produced by marked. */
export function highlightHtml(html: string): { html: string; used: boolean } {
  let used = false;
  const out = html.replace(
    /<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/gi,
    (_m, lang: string, encoded: string) => {
      used = true;
      const code = decodeHtmlEntities(encoded);
      const highlighted = highlightCode(code, lang);
      const safeLang = normalizeLang(lang) ?? lang;
      return `<pre class="language-${safeLang}"><code class="language-${safeLang}">${highlighted}</code></pre>`;
    },
  );
  // Also bare <pre><code> without language
  return { html: out, used };
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
