/** Markdown extensions shared by CLI and browser playground (no Node APIs). */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * GFM-style footnotes: `[^id]` refs + `[^id]: text` definitions.
 * Emits numbered buttons + hidden defs for the reader popover.
 */
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

  let n = 0;
  const order = new Map<string, number>();
  body = body.replace(/\[\^([^\]]+)\]/g, (_m, id: string) => {
    if (!order.has(id)) order.set(id, ++n);
    const num = order.get(id)!;
    return `<sup class="rdoc-fn"><button type="button" class="rdoc-fn-ref" data-fn="${escapeHtml(id)}" aria-label="Footnote ${escapeHtml(id)}">${num}</button></sup>`;
  });

  let footnotesHtml = "";
  if (defs.size > 0) {
    const items = [...defs.entries()]
      .map(
        ([id, text]) =>
          `<aside id="fn-${escapeHtml(id)}" hidden data-fn-def>${text}</aside>`,
      )
      .join("\n");
    const list = [...order.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([id, num]) => {
        const text = defs.get(id) ?? "";
        return `<li id="fn-list-${escapeHtml(id)}" value="${num}">${text} <a href="#fnref-back-${escapeHtml(id)}" class="rdoc-fn-back">↩</a></li>`;
      })
      .join("\n");
    footnotesHtml = `\n<div class="rdoc-footnotes" hidden>\n${items}\n</div>`;
    if (list) {
      footnotesHtml += `\n<section class="rdoc-fn-list" aria-label="Footnotes">\n<ol>\n${list}\n</ol>\n</section>\n`;
    }
  }

  return { markdown: body, footnotesHtml };
}

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

/**
 * Pandoc-style definition lists:
 *   Term
 *   : Definition
 */
export function processDefinitionLists(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const term = lines[i];
    const next = lines[i + 1];
    if (
      term !== undefined &&
      next !== undefined &&
      term.trim() &&
      !term.startsWith(" ") &&
      !term.startsWith("\t") &&
      !/^[#>*`-]/.test(term) &&
      /^:\s+/.test(next)
    ) {
      const defs: string[] = [];
      i++;
      while (i < lines.length && /^:\s+/.test(lines[i])) {
        defs.push(lines[i].replace(/^:\s+/, ""));
        i++;
      }
      out.push("<dl>");
      out.push(`<dt>${escapeHtml(term.trim())}</dt>`);
      for (const d of defs) {
        out.push(`<dd>${d}</dd>`);
      }
      out.push("</dl>");
      out.push("");
      continue;
    }
    out.push(term);
    i++;
  }
  return out.join("\n");
}

/** Normalize GFM task-list checkbox markers before marked parses. */
export function processTaskLists(md: string): string {
  return md.replace(
    /^(\s*[-*+]\s+)\[([ xX])\]\s+/gm,
    (_m, bullet: string, mark: string) => {
      const checked = mark.toLowerCase() === "x" ? "x" : " ";
      return `${bullet}[${checked}] `;
    },
  );
}

export function estimateReading(text: string): { words: number; minutes: number } {
  const words = text
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

export function guessTitle(md: string, fallback: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return (m?.[1] ?? fallback).trim();
}
