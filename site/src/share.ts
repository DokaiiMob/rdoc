/** Share-link helpers: compress Markdown / rdoc HTML into URL fragments. */

export const SHARE_MAX_RAW_BYTES = 12_000;
export const SHARE_MAX_FRAGMENT_CHARS = 24_000;

const PREFIX_MD = "md1.";
const PREFIX_HTML = "html1.";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStream is not available in this browser.");
  }
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream is not available in this browser.");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export type SharePayload =
  | { kind: "md"; text: string }
  | { kind: "html"; text: string };

export async function encodeShareFragment(payload: SharePayload): Promise<string> {
  const raw = new TextEncoder().encode(payload.text);
  if (raw.byteLength > SHARE_MAX_RAW_BYTES) {
    throw new Error(
      `Content is too large to share (${(raw.byteLength / 1024).toFixed(1)} KB). ` +
        `Share links support up to ${SHARE_MAX_RAW_BYTES / 1000} KB of Markdown or HTML.`,
    );
  }
  const compressed = await gzipCompress(raw);
  const prefix = payload.kind === "md" ? PREFIX_MD : PREFIX_HTML;
  const fragment = prefix + toBase64Url(compressed);
  if (fragment.length > SHARE_MAX_FRAGMENT_CHARS) {
    throw new Error(
      "Compressed share link is still too large for a URL. Try a shorter document.",
    );
  }
  return fragment;
}

export async function decodeShareFragment(fragment: string): Promise<SharePayload | null> {
  const hash = fragment.replace(/^#/, "").trim();
  if (!hash) return null;

  let kind: "md" | "html";
  let body: string;
  if (hash.startsWith(PREFIX_MD)) {
    kind = "md";
    body = hash.slice(PREFIX_MD.length);
  } else if (hash.startsWith(PREFIX_HTML)) {
    kind = "html";
    body = hash.slice(PREFIX_HTML.length);
  } else {
    return null;
  }

  if (!body || body.length > SHARE_MAX_FRAGMENT_CHARS) {
    throw new Error("Share link is empty or exceeds the size limit.");
  }

  const compressed = fromBase64Url(body);
  const raw = await gzipDecompress(compressed);
  if (raw.byteLength > SHARE_MAX_RAW_BYTES * 2) {
    throw new Error("Decoded content exceeds the safety size limit.");
  }
  return { kind, text: new TextDecoder().decode(raw) };
}

export function buildShareUrl(fragment: string): string {
  const url = new URL(location.href);
  url.hash = fragment;
  return url.toString();
}
