/** Markdown extensions shared by CLI and browser playground (no Node APIs). */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
