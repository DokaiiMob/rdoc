import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { estimateReading } from "./md-ext.js";
import { normalizeForHash } from "./normalize.js";
import type {
  InspectResult,
  RdocManifest,
  ValidateResult,
} from "./types.js";

export { estimateReading } from "./md-ext.js";

const MANIFEST_RE =
  /<script\s+type="application\/rdoc\+json"[^>]*>([\s\S]*?)<\/script>/i;
const CONTENT_RE =
  /<article\s+id="rdoc-content"[^>]*>([\s\S]*?)<\/article>/i;
const ARTICLE_COUNT_RE = /<article\b[^>]*\bid\s*=\s*["']rdoc-content["'][^>]*>/gi;
const CSP_RE =
  /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i;
const HASH_RE = /^[0-9a-f]{64}$/;

export function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** SHA-256 of article HTML after RFC canonicalization (NFC + LF). */
export function hashArticleContent(articleInner: string): string {
  return sha256Hex(normalizeForHash(articleInner));
}

export function extractManifest(html: string): RdocManifest {
  const match = html.match(MANIFEST_RE);
  if (!match) {
    throw new Error("RDOC manifest not found (script[type=application/rdoc+json]).");
  }
  const raw = match[1].trim();
  const parsed = JSON.parse(raw) as RdocManifest;
  if (parsed.format !== "rdoc" || !parsed.contentHash) {
    throw new Error("Invalid RDOC manifest.");
  }
  return parsed;
}

export function extractContentHtml(html: string): string {
  const match = html.match(CONTENT_RE);
  if (!match) {
    throw new Error('Content not found: expected <article id="rdoc-content">.');
  }
  return match[1];
}

export function countRdocArticles(html: string): number {
  const matches = html.match(ARTICLE_COUNT_RE);
  return matches?.length ?? 0;
}

export function hasCspMeta(html: string): boolean {
  return CSP_RE.test(html);
}

export function verifyContentHash(html: string, expectedHash: string): boolean {
  const content = extractContentHtml(html);
  return hashArticleContent(content) === expectedHash.toLowerCase();
}

export async function inspectRdoc(filePath: string): Promise<InspectResult> {
  const buf = await readFile(filePath);
  const html = buf.toString("utf8");
  const manifest = extractManifest(html);
  const hashValid = verifyContentHash(html, manifest.contentHash);
  return {
    manifest,
    fileSize: buf.byteLength,
    hashValid,
    path: filePath,
    cspPresent: hasCspMeta(html),
    articleCount: countRdocArticles(html),
  };
}

/**
 * Strict validation for CI.
 * Exit code mapping (CLI): 0 ok, 1 I/O/parse, 2 integrity/structure failure.
 */
export async function validateRdoc(filePath: string): Promise<ValidateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let inspect: InspectResult | undefined;

  try {
    inspect = await inspectRdoc(filePath);
  } catch (err) {
    return {
      ok: false,
      path: filePath,
      errors: [err instanceof Error ? err.message : String(err)],
      warnings,
    };
  }

  const m = inspect.manifest;
  if (m.format !== "rdoc") errors.push(`format must be "rdoc" (got ${String(m.format)})`);
  if (!m.version) errors.push("version is required");
  if (!m.title) errors.push("title is required");
  if (!m.author) errors.push("author is required");
  if (!m.created) errors.push("created is required");
  if (!m.lang) errors.push("lang is required");
  if (!HASH_RE.test(String(m.contentHash).toLowerCase())) {
    errors.push("contentHash must be 64 lowercase hex chars");
  }
  if (!inspect.hashValid) errors.push("contentHash mismatch (integrity failure)");
  if (!inspect.cspPresent) {
    errors.push("missing Content-Security-Policy meta (required by RFC 0001 producers)");
  }
  if (inspect.articleCount !== 1) {
    errors.push(`expected exactly one <article id="rdoc-content"> (found ${inspect.articleCount})`);
  }
  if (typeof m.readingMinutes !== "number" || m.readingMinutes < 1) {
    errors.push("readingMinutes must be an integer >= 1");
  }
  if (typeof m.wordCount !== "number" || m.wordCount < 0) {
    errors.push("wordCount must be an integer >= 0");
  }

  if (m.profile !== undefined) {
    const allowed = ["article", "slides", "contract", "paper"];
    if (!allowed.includes(String(m.profile))) {
      errors.push(`profile must be one of ${allowed.join("|")}`);
    }
  }
  if (m.canonicalUrl !== undefined && typeof m.canonicalUrl === "string") {
    try {
      // eslint-disable-next-line no-new
      new URL(m.canonicalUrl);
    } catch {
      errors.push("canonicalUrl must be an absolute URI");
    }
  }
  if (m.authorKeys !== undefined) {
    if (typeof m.authorKeys !== "string") {
      errors.push("authorKeys must be a string URL when present");
    } else {
      try {
        // eslint-disable-next-line no-new
        new URL(m.authorKeys);
      } catch {
        errors.push("authorKeys must be an absolute URI");
      }
    }
  }

  // Unknown fields are OK — version negotiation (warn only in verbose tools).
  if (!m.license && m.profile === "contract") {
    warnings.push("contract profile usually sets license/rights");
  }

  if (m.signature !== undefined) {
    const sig = m.signature as {
      alg?: string;
      publicKey?: string;
      sig?: string;
    };
    if (!sig || typeof sig !== "object") {
      errors.push("signature must be an object when present");
    } else if (sig.alg !== "Ed25519") {
      errors.push('signature.alg must be "Ed25519"');
    } else if (!sig.publicKey || !sig.sig) {
      errors.push("signature requires publicKey and sig");
    } else {
      try {
        const { verifySignature } = await import("./sign.js");
        if (!verifySignature(String(m.contentHash), sig as import("./types.js").RdocSignature)) {
          errors.push("signature verification failed (RFC 0002)");
        }
      } catch (err) {
        errors.push(
          `signature check error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    path: filePath,
    errors,
    warnings,
    inspect,
  };
}
