/**
 * Minimal BibTeX subset → end references + [@key] / [@key1; @key2] cite links.
 * Not a full CSL engine — enough for basic academic notes.
 */

import { readFile } from "node:fs/promises";
import { escapeHtml } from "./md-ext.js";

export interface BibEntry {
  key: string;
  type: string;
  fields: Record<string, string>;
}

export function parseBibTeX(src: string): Map<string, BibEntry> {
  const map = new Map<string, BibEntry>();
  const entryRe = /@(\w+)\s*\{\s*([^,]+)\s*,([\s\S]*?)\n\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(src)) !== null) {
    const type = m[1].toLowerCase();
    const key = m[2].trim();
    const body = m[3];
    const fields: Record<string, string> = {};
    const fieldRe = /(\w+)\s*=\s*(\{([^{}]*)\}|"([^"]*)"|(\S+))/g;
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(body)) !== null) {
      fields[f[1].toLowerCase()] = (f[3] ?? f[4] ?? f[5] ?? "").trim();
    }
    map.set(key, { key, type, fields });
  }
  return map;
}

function formatEntry(e: BibEntry): string {
  const f = e.fields;
  const author = f.author?.replace(/\s+and\s+/gi, ", ") ?? "Unknown";
  const title = f.title ?? e.key;
  const year = f.year ?? "";
  const venue = f.journal ?? f.booktitle ?? f.publisher ?? "";
  const bits = [author, `<em>${escapeHtml(title)}</em>`];
  if (venue) bits.push(escapeHtml(venue));
  if (year) bits.push(escapeHtml(year));
  if (f.url) bits.push(escapeHtml(f.url));
  if (f.doi) bits.push(`doi:${escapeHtml(f.doi)}`);
  return bits.join(". ") + ".";
}

export interface CitationResult {
  markdown: string;
  bibliographyHtml: string;
  cited: string[];
  missing: string[];
}

/**
 * Replace [@key] / [@{key}] citekeys with footnote-style refs and append a bibliography.
 */
export function applyCitations(
  md: string,
  bib: Map<string, BibEntry>,
): CitationResult {
  const cited: string[] = [];
  const missing: string[] = [];
  const order = new Map<string, number>();

  const markdown = md.replace(
    /\[@([^\]]+)\]/g,
    (_m, keysRaw: string) => {
      const keys = keysRaw.split(/[;,]/).map((k) => k.trim().replace(/^@/, ""));
      const nums: number[] = [];
      for (const key of keys) {
        if (!bib.has(key)) {
          missing.push(key);
          continue;
        }
        if (!order.has(key)) {
          order.set(key, order.size + 1);
          cited.push(key);
        }
        nums.push(order.get(key)!);
      }
      if (!nums.length) return `[?${escapeHtml(keysRaw)}]`;
      return nums
        .map(
          (n) =>
            `<a class="rdoc-cite" href="#ref-${n}" id="cite-${n}-${cited.length}">[${n}]</a>`,
        )
        .join("");
    },
  );

  let bibliographyHtml = "";
  if (order.size > 0) {
    const items = [...order.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([key, n]) => {
        const e = bib.get(key)!;
        return `<li id="ref-${n}" value="${n}">${formatEntry(e)}</li>`;
      })
      .join("\n");
    bibliographyHtml = `\n<section class="rdoc-bibliography" aria-label="References">\n<h2>References</h2>\n<ol>\n${items}\n</ol>\n</section>\n`;
  }

  return {
    markdown,
    bibliographyHtml,
    cited,
    missing: [...new Set(missing)],
  };
}

export async function loadBibFile(
  bibPath: string,
): Promise<Map<string, BibEntry>> {
  const raw = await readFile(bibPath, "utf8");
  return parseBibTeX(raw);
}
