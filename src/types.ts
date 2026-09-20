/** RDOC format version embedded in every document. */
export const RDOC_VERSION = "1.1.0";

/** Optional document profile (RFC 0001). */
export type RdocProfile = "article" | "slides" | "contract" | "paper";

/** Optional Ed25519 attestation over contentHash (RFC 0002 Draft). */
export interface RdocSignature {
  alg: "Ed25519";
  /** Standard Base64 of the raw 32-byte public key. */
  publicKey: string;
  /** Standard Base64 of the 64-byte signature. */
  sig: string;
  /** Optional opaque key hint (e.g. truncated SHA-256 of publicKey). */
  keyId?: string;
}

/** Detached sidecar file (`.rdoc.sig`) — RFC 0002. */
export interface RdocDetachedSig {
  format: "rdoc-sig";
  version: "1" | string;
  contentHash: string;
  alg: "Ed25519";
  publicKey: string;
  sig: string;
  keyId?: string;
}

export interface RdocManifest {
  format: "rdoc";
  version: string;
  title: string;
  author: string;
  created: string;
  lang: string;
  /** SHA-256 hex digest of the article content HTML. */
  contentHash: string;
  /** Estimated reading time in whole minutes. */
  readingMinutes: number;
  wordCount: number;
  /** Optional free-form description. */
  description?: string;
  /** Optional reading/authoring profile. */
  profile?: RdocProfile;
  /** Optional web twin URL. */
  canonicalUrl?: string;
  /** SPDX license identifier, e.g. MIT, CC-BY-4.0 */
  license?: string;
  /** Free-text rights notice. */
  rights?: string;
  /** Optional CSS accent color (e.g. `#0b6e4f`); sets `--accent` in the reader. */
  themeAccent?: string;
  /** Optional tags from front-matter or CLI. */
  tags?: string[];
  /** Optional Ed25519 signature over contentHash (RFC 0002). */
  signature?: RdocSignature;
  /**
   * Optional URL of an author key discovery document (RFC 0002).
   * Readers MUST NOT require network access to open the document;
   * only authoring / verify tooling may fetch this (e.g. `rdoc verify --fetch-keys`).
   */
  authorKeys?: string;
  /**
   * Forward compatibility: readers MUST ignore unknown fields
   * (additional properties allowed at parse time).
   */
  [key: string]: unknown;
}

export interface BuildOptions {
  inputPath: string;
  outputPath: string;
  title?: string;
  author?: string;
  lang?: string;
  description?: string;
  profile?: RdocProfile;
  canonicalUrl?: string;
  license?: string;
  rights?: string;
  /** ISO-8601 or SOURCE_DATE_EPOCH override for reproducible builds. */
  created?: string;
  /** Optional CSS accent color embedded in the manifest. */
  themeAccent?: string;
  /** Optional tags (also from YAML front-matter). */
  tags?: string[];
  /**
   * When true, emit dual CSP: enforcing production policy plus
   * Content-Security-Policy-Report-Only for author debugging.
   */
  cspReport?: boolean;
  /**
   * Directory used to resolve relative image paths.
   * Defaults to the input file's directory.
   */
  assetsDir?: string;
  /**
   * Reject http(s) images (default true). data: and local paths allowed.
   * Alias concept: --allow-data-images-only.
   */
  failOnExternal?: boolean;
  /** Compile-time Prism highlighting (default true). */
  highlight?: boolean;
  /** Compile-time KaTeX math (default true). */
  math?: boolean;
  /** Attempt Mermaid/Graphviz → SVG (default true; skips with warning if tools missing). */
  diagrams?: boolean;
  /** Path to a .bib file for [@citekey] support. */
  bibliography?: string;
  /** HTML input: strip nav/footer chrome heuristically. */
  readability?: boolean;
}

export interface InspectResult {
  manifest: RdocManifest;
  fileSize: number;
  hashValid: boolean;
  path: string;
  cspPresent: boolean;
  articleCount: number;
}

export interface RdocConfig {
  author?: string;
  lang?: string;
  title?: string;
  description?: string;
  profile?: RdocProfile;
  canonicalUrl?: string;
  license?: string;
  rights?: string;
  tags?: string[];
  themeDefault?: "system" | "light" | "dark";
  themeAccent?: string;
  output?: string;
  assetsDir?: string;
  failOnExternal?: boolean;
  highlight?: boolean;
  math?: boolean;
  diagrams?: boolean;
  bibliography?: string;
}

export interface ValidateResult {
  ok: boolean;
  path: string;
  errors: string[];
  warnings: string[];
  inspect?: InspectResult;
}
