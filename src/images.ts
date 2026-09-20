import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

/**
 * Encode a buffer to base64 in fixed-size chunks (multiple of 3 bytes)
 * so concatenating chunk encodings equals encoding the whole buffer,
 * without allocating one giant intermediate string from a huge Buffer.
 */
export function encodeBase64Chunked(
  buf: Buffer,
  chunkSize = 48 * 1024,
): string {
  const size = Math.max(3, chunkSize - (chunkSize % 3));
  if (buf.byteLength <= size) {
    return buf.toString("base64");
  }
  const parts: string[] = new Array(Math.ceil(buf.byteLength / size));
  let p = 0;
  for (let i = 0; i < buf.byteLength; i += size) {
    parts[p++] = buf
      .subarray(i, Math.min(i + size, buf.byteLength))
      .toString("base64");
  }
  return parts.join("");
}

export interface InlineImagesOptions {
  /** Directory used to resolve relative image paths (defaults to input dir). */
  assetsDir: string;
  /**
   * When true (default), reject http(s) / protocol-relative image URLs.
   * data: URLs are always allowed.
   */
  failOnExternal?: boolean;
}

/**
 * Replace local `<img src>` with chunked `data:` URLs.
 * External images throw when failOnExternal is true.
 */
export async function inlineLocalImages(
  html: string,
  opts: InlineImagesOptions,
): Promise<string> {
  const failOnExternal = opts.failOnExternal !== false;
  const imgRe = /<img\b([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;
  const parts: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = imgRe.exec(html)) !== null) {
    parts.push(html.slice(last, match.index));
    const before = match[1];
    const src = match[2];
    const after = match[3];

    if (src.startsWith("data:")) {
      parts.push(match[0]);
    } else if (/^https?:/i.test(src) || src.startsWith("//")) {
      if (failOnExternal) {
        throw new Error(
          `External images are forbidden in .rdoc (pass --no-fail-on-external to override): ${src}`,
        );
      }
      parts.push(match[0]);
    } else {
      const abs = path.resolve(opts.assetsDir, src);
      const ext = path.extname(abs).toLowerCase();
      const mime = MIME[ext];
      if (!mime) {
        throw new Error(`Unsupported image type: ${src}`);
      }
      const buf = await readFile(abs);
      const b64 = encodeBase64Chunked(buf);
      parts.push(`<img${before}src="data:${mime};base64,${b64}"${after}>`);
    }
    last = match.index + match[0].length;
  }
  parts.push(html.slice(last));
  return parts.join("");
}
