/**
 * HTML input mode: accept .html / .htm as build sources.
 * Optional lightweight "readability" pass strips chrome (nav/footer/aside).
 */

import { sanitizeArticleHtml } from "./normalize.js";

export function isHtmlInput(filePath: string): boolean {
  return /\.html?$/i.test(filePath);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Pull title from <title> or first <h1>. */
export function extractHtmlTitle(html: string, fallback: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) return stripTags(t[1]).trim() || fallback;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]).trim() || fallback;
  return fallback;
}

/**
 * Extract main article body. Prefer <article>, then <main>, then <body>.
 * With readability=true, drop nav/header/footer/aside/script/style.
 */
export function extractArticleFromHtml(
  html: string,
  opts: { readability?: boolean } = {},
): string {
  let work = html;

  // Drop non-content early
  work = work
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  if (opts.readability) {
    work = work
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<form[\s\S]*?<\/form>/gi, "");
  }

  const article = work.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article) return sanitizeArticleHtml(article[1].trim());

  const main = work.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return sanitizeArticleHtml(main[1].trim());

  const body = work.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body) {
    let inner = body[1];
    if (opts.readability) {
      // Heuristic: largest <div> / <section> by text length
      const candidates = [
        ...inner.matchAll(/<(div|section)\b[^>]*>([\s\S]*?)<\/\1>/gi),
      ];
      if (candidates.length) {
        let best = candidates[0][2];
        let bestLen = stripTags(best).length;
        for (const c of candidates) {
          const len = stripTags(c[2]).length;
          if (len > bestLen) {
            best = c[2];
            bestLen = len;
          }
        }
        inner = best;
      }
    }
    return sanitizeArticleHtml(inner.trim());
  }

  return sanitizeArticleHtml(work.trim());
}
