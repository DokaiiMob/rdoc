/**
 * Ed25519 sign / verify over contentHash (RFC 0002 Draft).
 */
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject,
} from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RdocDetachedSig, RdocManifest, RdocSignature } from "./types.js";
import { extractManifest, inspectRdoc, verifyContentHash } from "./validator.js";

const MANIFEST_BLOCK_RE =
  /(<script\s+type="application\/rdoc\+json"[^>]*>)([\s\S]*?)(<\/script>)/i;

export function keyIdFromPublicRaw(raw32: Buffer): string {
  return createHash("sha256").update(raw32).digest("hex").slice(0, 16);
}

/** Export raw 32-byte Ed25519 public key from a KeyObject / PEM. */
export function exportRawPublicKey(key: KeyObject | string): Buffer {
  const obj = typeof key === "string" ? createPublicKey(key) : key;
  const spki = obj.export({ type: "spki", format: "der" });
  // SPKI for Ed25519: 12-byte prefix + 32-byte raw key
  if (spki.length < 44) {
    throw new Error("Unexpected Ed25519 SPKI length");
  }
  return Buffer.from(spki.subarray(spki.length - 32));
}

export function generateEd25519KeyPair(): {
  privateKeyPem: string;
  publicKeyPem: string;
  publicKeyRaw: Buffer;
  keyId: string;
} {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const publicKeyRaw = exportRawPublicKey(publicKey);
  return {
    privateKeyPem,
    publicKeyPem,
    publicKeyRaw,
    keyId: keyIdFromPublicRaw(publicKeyRaw),
  };
}

export async function writeKeyPair(
  outDir: string,
  basename = "rdoc",
): Promise<{ privatePath: string; publicPath: string; keyId: string }> {
  const pair = generateEd25519KeyPair();
  const privatePath = path.resolve(outDir, `${basename}.private.pem`);
  const publicPath = path.resolve(outDir, `${basename}.public.pem`);
  await writeFile(privatePath, pair.privateKeyPem, { encoding: "utf8", mode: 0o600 });
  await writeFile(publicPath, pair.publicKeyPem, "utf8");
  return { privatePath, publicPath, keyId: pair.keyId };
}

function contentHashBytes(hex: string): Buffer {
  const h = hex.toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) {
    throw new Error("contentHash must be 64 lowercase hex characters");
  }
  return Buffer.from(h, "hex");
}

export function signContentHash(
  contentHash: string,
  privateKeyPem: string,
): RdocSignature {
  const priv = createPrivateKey(privateKeyPem);
  const msg = contentHashBytes(contentHash);
  const sig = cryptoSign(null, msg, priv);
  const publicKeyRaw = exportRawPublicKey(createPublicKey(priv));
  return {
    alg: "Ed25519",
    publicKey: publicKeyRaw.toString("base64"),
    sig: sig.toString("base64"),
    keyId: keyIdFromPublicRaw(publicKeyRaw),
  };
}

export function verifySignature(
  contentHash: string,
  signature: RdocSignature,
): boolean {
  if (signature.alg !== "Ed25519") return false;
  let pubRaw: Buffer;
  let sigBuf: Buffer;
  try {
    pubRaw = Buffer.from(signature.publicKey, "base64");
    sigBuf = Buffer.from(signature.sig, "base64");
  } catch {
    return false;
  }
  if (pubRaw.length !== 32 || sigBuf.length !== 64) return false;

  // Reconstruct SPKI DER for createPublicKey
  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const spki = Buffer.concat([spkiPrefix, pubRaw]);
  const pub = createPublicKey({ key: spki, format: "der", type: "spki" });
  const msg = contentHashBytes(contentHash);
  return cryptoVerify(null, msg, pub, sigBuf);
}

export function replaceManifestInHtml(
  html: string,
  manifest: RdocManifest,
): string {
  if (!MANIFEST_BLOCK_RE.test(html)) {
    throw new Error("RDOC manifest script block not found");
  }
  const body = `\n${JSON.stringify(manifest, null, 2)}\n`;
  return html.replace(MANIFEST_BLOCK_RE, `$1${body}$3`);
}

/** Sidecar path: `doc.rdoc.html` → `doc.rdoc.html.rdoc.sig`, `doc.rdoc` → `doc.rdoc.sig`. */
export function detachedSigPath(rdocPath: string): string {
  return `${path.resolve(rdocPath)}.rdoc.sig`;
}

export function toDetachedSig(
  contentHash: string,
  signature: RdocSignature,
): RdocDetachedSig {
  return {
    format: "rdoc-sig",
    version: "1",
    contentHash: contentHash.toLowerCase(),
    alg: signature.alg,
    publicKey: signature.publicKey,
    sig: signature.sig,
    keyId: signature.keyId,
  };
}

export function detachedToSignature(det: RdocDetachedSig): RdocSignature {
  return {
    alg: det.alg,
    publicKey: det.publicKey,
    sig: det.sig,
    keyId: det.keyId,
  };
}

export async function readDetachedSig(
  sigPath: string,
): Promise<RdocDetachedSig> {
  const raw = await readFile(sigPath, "utf8");
  const parsed = JSON.parse(raw) as RdocDetachedSig;
  if (parsed.format !== "rdoc-sig") {
    throw new Error('detached signature format must be "rdoc-sig"');
  }
  if (parsed.alg !== "Ed25519" || !parsed.publicKey || !parsed.sig || !parsed.contentHash) {
    throw new Error("detached signature missing required fields");
  }
  return parsed;
}

export async function writeDetachedSig(
  rdocPath: string,
  contentHash: string,
  signature: RdocSignature,
): Promise<string> {
  const out = detachedSigPath(rdocPath);
  const body = toDetachedSig(contentHash, signature);
  await writeFile(out, JSON.stringify(body, null, 2) + "\n", "utf8");
  return out;
}

export async function signRdocFile(
  filePath: string,
  privateKeyPem: string,
  opts?: { detached?: boolean },
): Promise<{
  path: string;
  signature: RdocSignature;
  manifest: RdocManifest;
  detachedPath?: string;
}> {
  const abs = path.resolve(filePath);
  const html = await readFile(abs, "utf8");
  const manifest = extractManifest(html);
  if (!verifyContentHash(html, manifest.contentHash)) {
    throw new Error("contentHash mismatch — refuse to sign a tampered document");
  }
  const signature = signContentHash(manifest.contentHash, privateKeyPem);

  if (opts?.detached) {
    const detachedPath = await writeDetachedSig(abs, manifest.contentHash, signature);
    return { path: abs, signature, manifest, detachedPath };
  }

  const next: RdocManifest = { ...manifest, signature };
  const out = replaceManifestInHtml(html, next);
  await writeFile(abs, out, "utf8");
  return { path: abs, signature, manifest: next };
}

/**
 * Optional key discovery document at `authorKeys` URL.
 * Readers MUST NOT fetch this when opening a document.
 */
export interface AuthorKeysDoc {
  keys?: Array<{
    alg?: string;
    publicKey?: string;
    keyId?: string;
  }>;
}

export async function fetchAuthorKeys(
  url: string,
): Promise<AuthorKeysDoc> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`authorKeys fetch failed: HTTP ${res.status}`);
  }
  return (await res.json()) as AuthorKeysDoc;
}

export type VerifyStatus =
  | { ok: true; status: "signed"; keyId?: string; source: "embedded" | "detached" }
  | { ok: true; status: "unsigned" }
  | {
      ok: false;
      status: "hash-fail" | "sig-fail" | "bad-signature-field" | "key-mismatch";
      detail: string;
    };

export async function verifyRdocFile(
  filePath: string,
  opts?: {
    allowUnsigned?: boolean;
    /** Explicit sidecar path; otherwise tries `<file>.rdoc.sig`. */
    detachedPath?: string;
    /**
     * When true, fetch `manifest.authorKeys` (default OFF).
     * Never used by the reader open path.
     */
    fetchKeys?: boolean;
  },
): Promise<VerifyStatus> {
  const abs = path.resolve(filePath);
  const info = await inspectRdoc(abs);
  if (!info.hashValid) {
    return {
      ok: false,
      status: "hash-fail",
      detail: "contentHash mismatch (integrity failure)",
    };
  }

  let sig: RdocSignature | undefined;
  let source: "embedded" | "detached" = "embedded";

  const embedded = info.manifest.signature;
  if (embedded && typeof embedded === "object") {
    sig = embedded as RdocSignature;
    source = "embedded";
  } else {
    const candidate = opts?.detachedPath
      ? path.resolve(opts.detachedPath)
      : detachedSigPath(abs);
    try {
      await access(candidate);
      const det = await readDetachedSig(candidate);
      if (det.contentHash.toLowerCase() !== info.manifest.contentHash.toLowerCase()) {
        return {
          ok: false,
          status: "sig-fail",
          detail: "detached signature contentHash does not match document",
        };
      }
      sig = detachedToSignature(det);
      source = "detached";
    } catch {
      /* no sidecar */
    }
  }

  if (!sig) {
    if (opts?.allowUnsigned) {
      return { ok: true, status: "unsigned" };
    }
    return {
      ok: false,
      status: "bad-signature-field",
      detail: "document is unsigned (pass --allow-unsigned to accept)",
    };
  }

  if (sig.alg !== "Ed25519" || !sig.publicKey || !sig.sig) {
    return {
      ok: false,
      status: "bad-signature-field",
      detail: "signature object missing alg/publicKey/sig",
    };
  }

  if (opts?.fetchKeys && typeof info.manifest.authorKeys === "string") {
    try {
      const keysDoc = await fetchAuthorKeys(info.manifest.authorKeys);
      const listed = (keysDoc.keys ?? []).some(
        (k) =>
          k.alg === "Ed25519" &&
          k.publicKey === sig!.publicKey &&
          (!sig!.keyId || !k.keyId || k.keyId === sig!.keyId),
      );
      if ((keysDoc.keys ?? []).length > 0 && !listed) {
        return {
          ok: false,
          status: "key-mismatch",
          detail: "signature publicKey not listed at authorKeys URL",
        };
      }
    } catch (err) {
      return {
        ok: false,
        status: "key-mismatch",
        detail: `authorKeys fetch error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (!verifySignature(info.manifest.contentHash, sig)) {
    return {
      ok: false,
      status: "sig-fail",
      detail: "Ed25519 signature verification failed",
    };
  }
  return { ok: true, status: "signed", keyId: sig.keyId, source };
}
