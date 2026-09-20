/**
 * Canonicalization before contentHash (RFC 0001 §7).
 * Makes integrity stable across Git autocrlf and editor line-ending differences.
 */
export function normalizeForHash(text: string): string {
  // Unicode NFC, then unify all newlines to LF, then trim outer whitespace.
  const nfc = text.normalize("NFC");
  const lf = nfc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return lf.trim();
}

/** Strip active content that must not appear inside hashed article HTML. */
export function sanitizeArticleHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

/** CSP for self-contained documents — blocks network exfiltration. */
export const RDOC_CSP =
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; " +
  "style-src 'unsafe-inline'; img-src data: blob:; script-src 'unsafe-inline'; " +
  "connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'";
