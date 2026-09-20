'use strict';

/**
 * Minimal port of repo validator (NFC + LF + SHA-256 of #rdoc-content).
 * Keep in sync with src/validator.ts + src/normalize.ts.
 */

const { createHash } = require('crypto');

const MANIFEST_RE =
  /<script\s+type=["']application\/rdoc\+json["'][^>]*>([\s\S]*?)<\/script>/i;
const CONTENT_RE =
  /<article\s+id=["']rdoc-content["'][^>]*>([\s\S]*?)<\/article>/i;
const CSP_RE =
  /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i;
const HASH_RE = /^[0-9a-f]{64}$/;

function normalizeForHash(text) {
  const nfc = text.normalize('NFC');
  const lf = nfc.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return lf.trim();
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function hashArticleContent(articleInner) {
  return sha256Hex(normalizeForHash(articleInner));
}

/**
 * @param {string} html
 * @returns {{
 *   ok: boolean,
 *   status: 'ok' | 'fail' | 'missing',
 *   label: string,
 *   detail: string,
 *   shortHash: string,
 *   title: string | null,
 *   themeHint: 'light' | 'dark' | null
 * }}
 */
function validateHtml(html) {
  const themeHint = detectThemeHint(html);
  let title = null;
  const titleM = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleM && titleM[1].trim()) title = titleM[1].trim();

  const manMatch = html.match(MANIFEST_RE);
  if (!manMatch) {
    return {
      ok: false,
      status: 'missing',
      label: '✗ No manifest',
      detail: 'Missing application/rdoc+json manifest',
      shortHash: '',
      title,
      themeHint,
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(manMatch[1].trim());
  } catch (err) {
    return {
      ok: false,
      status: 'fail',
      label: '✗ Bad manifest',
      detail: err.message || 'Invalid JSON',
      shortHash: '',
      title,
      themeHint,
    };
  }

  if (manifest && typeof manifest.title === 'string' && manifest.title.trim()) {
    title = manifest.title.trim();
  }

  const expected = String(manifest.contentHash || '').toLowerCase();
  if (!HASH_RE.test(expected)) {
    return {
      ok: false,
      status: 'fail',
      label: '✗ Bad hash',
      detail: 'contentHash must be 64 lowercase hex chars',
      shortHash: expected.slice(0, 8),
      title,
      themeHint,
    };
  }

  const contentMatch = html.match(CONTENT_RE);
  if (!contentMatch) {
    return {
      ok: false,
      status: 'fail',
      label: '✗ No article',
      detail: 'Expected <article id="rdoc-content">',
      shortHash: expected.slice(0, 8),
      title,
      themeHint,
    };
  }

  const actual = hashArticleContent(contentMatch[1]);
  const hashOk = actual === expected;
  const cspOk = CSP_RE.test(html);
  const ok = hashOk && cspOk && manifest.format === 'rdoc';

  if (!hashOk) {
    return {
      ok: false,
      status: 'fail',
      label: '✗ Hash mismatch',
      detail: `expected ${expected.slice(0, 12)}… got ${actual.slice(0, 12)}…`,
      shortHash: expected.slice(0, 8),
      title,
      themeHint,
    };
  }
  if (!cspOk) {
    return {
      ok: false,
      status: 'fail',
      label: '✗ No CSP',
      detail: 'Missing Content-Security-Policy meta',
      shortHash: expected.slice(0, 8),
      title,
      themeHint,
    };
  }
  if (manifest.format !== 'rdoc') {
    return {
      ok: false,
      status: 'fail',
      label: '✗ Bad format',
      detail: `format must be "rdoc" (got ${String(manifest.format)})`,
      shortHash: expected.slice(0, 8),
      title,
      themeHint,
    };
  }

  return {
    ok: true,
    status: 'ok',
    label: `✓ ${expected.slice(0, 8)}`,
    detail: `contentHash OK · ${expected}`,
    shortHash: expected.slice(0, 8),
    title,
    themeHint,
  };
}

function detectThemeHint(html) {
  const htmlTag = html.match(/<html\b([^>]*)>/i);
  if (htmlTag) {
    const attrs = htmlTag[1];
    const dataTheme = attrs.match(/data-theme\s*=\s*["']([^"']+)["']/i);
    if (dataTheme) {
      const v = dataTheme[1].toLowerCase();
      if (v === 'dark' || v === 'night') return 'dark';
      if (v === 'light' || v === 'day') return 'light';
    }
    if (/\bclass\s*=\s*["'][^"']*\bdark\b/i.test(attrs)) return 'dark';
  }
  const colorScheme = html.match(
    /<meta\b[^>]*name\s*=\s*["']color-scheme["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  );
  if (colorScheme) {
    const v = colorScheme[1].toLowerCase();
    if (v.includes('dark') && !v.includes('light')) return 'dark';
    if (v.includes('light') && !v.includes('dark')) return 'light';
  }
  return null;
}

module.exports = { validateHtml, hashArticleContent, normalizeForHash };
