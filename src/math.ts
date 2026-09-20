/**
 * Compile-time math via KaTeX → HTML+MathML (offline, no CDN).
 * Supports $...$ (inline) and $$...$$ / \[...\] (display).
 * Partial: no ams environments beyond what KaTeX ships; macros limited.
 */

import katex from "katex";

/** Compact KaTeX CSS subset sufficient for static HTML (no webfonts). */
export const KATEX_CSS = `/* KaTeX (rdoc offline, system fonts) */
.katex { font: normal 1.1em Georgia, "Times New Roman", serif; line-height: 1.2; text-indent: 0; text-rendering: auto; }
.katex * { border-color: currentColor; }
.katex .katex-mathml { position: absolute; clip: rect(1px,1px,1px,1px); padding: 0; border: 0; height: 1px; width: 1px; overflow: hidden; }
.katex .katex-html { display: inline-block; }
.katex .base { display: inline-block; }
.katex .strut { display: inline-block; }
.katex .mathrm { font-style: normal; }
.katex .mathit { font-style: italic; }
.katex .mathbf { font-weight: bold; }
.katex .mbin, .katex .mrel, .katex .mop { padding: 0 0.08em; }
.katex-display { display: block; margin: 1em 0; text-align: center; }
.katex-display > .katex { display: inline-block; text-align: initial; }
.katex .frac-line { display: inline-block; width: 100%; border-bottom-style: solid; border-bottom-width: 0.04em; }
.katex .sqrt > .root { margin-left: 0.2em; }
.rdoc-math-error { color: #b00020; font-family: monospace; font-size: 0.9em; }
`;

function renderOne(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      trust: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `<span class="rdoc-math-error" title="${msg}">${tex}</span>`;
  }
}

/**
 * Protect fenced code blocks, then replace math delimiters.
 * Returns HTML fragments already escaped by KaTeX.
 */
export function processMath(md: string): { markdown: string; used: boolean } {
  const fences: string[] = [];
  let used = false;
  let protectedMd = md.replace(/```[\s\S]*?```|`[^`\n]+`/g, (m) => {
    const i = fences.length;
    fences.push(m);
    return `\u0000FENCE${i}\u0000`;
  });

  // Display $$...$$
  protectedMd = protectedMd.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
    used = true;
    return `\n\n<div class="rdoc-math rdoc-math-display">${renderOne(tex, true)}</div>\n\n`;
  });

  // Display \[...\]
  protectedMd = protectedMd.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex: string) => {
    used = true;
    return `\n\n<div class="rdoc-math rdoc-math-display">${renderOne(tex, true)}</div>\n\n`;
  });

  // Inline $...$ (no newlines)
  protectedMd = protectedMd.replace(
    /(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g,
    (_m, tex: string) => {
      used = true;
      return `<span class="rdoc-math rdoc-math-inline">${renderOne(tex, false)}</span>`;
    },
  );

  // Inline \(...\)
  protectedMd = protectedMd.replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex: string) => {
    used = true;
    return `<span class="rdoc-math rdoc-math-inline">${renderOne(tex, false)}</span>`;
  });

  const restored = protectedMd.replace(/\u0000FENCE(\d+)\u0000/g, (_m, i: string) => {
    return fences[Number(i)] ?? "";
  });

  return { markdown: restored, used };
}
