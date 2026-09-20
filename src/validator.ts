import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { InspectResult, RdocManifest } from "./types.js";

const MANIFEST_RE =
  /<script\s+type="application\/rdoc\+json"[^>]*>([\s\S]*?)<\/script>/i;
const CONTENT_RE =
  /<article\s+id="rdoc-content"[^>]*>([\s\S]*?)<\/article>/i;

export function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function extractManifest(html: string): RdocManifest {
  const match = html.match(MANIFEST_RE);
  if (!match) {
    throw new Error("Манифест RDOC не найден (script[type=application/rdoc+json]).");
  }
  const raw = match[1].trim();
  const parsed = JSON.parse(raw) as RdocManifest;
  if (parsed.format !== "rdoc" || !parsed.contentHash) {
    throw new Error("Некорректный манифест RDOC.");
  }
  return parsed;
}

export function extractContentHtml(html: string): string {
  const match = html.match(CONTENT_RE);
  if (!match) {
    throw new Error('Контент не найден: ожидается <article id="rdoc-content">.');
  }
  // Trim wrapper whitespace introduced by the document shell.
  return match[1].trim();
}

export function verifyContentHash(html: string, expectedHash: string): boolean {
  const content = extractContentHtml(html);
  return sha256Hex(content) === expectedHash.toLowerCase();
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
  };
}

/** Rough reading-time estimate: ~200 words/min for mixed RU/EN prose. */
export function estimateReading(text: string): { words: number; minutes: number } {
  const words = text
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}
