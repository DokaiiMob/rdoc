/** RDOC format version embedded in every document. */
export const RDOC_VERSION = "1.1.0";

/** Optional document profile (RFC 0001). */
export type RdocProfile = "article" | "slides" | "contract" | "paper";

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
  themeDefault?: "system" | "light" | "dark";
  output?: string;
}

export interface ValidateResult {
  ok: boolean;
  path: string;
  errors: string[];
  warnings: string[];
  inspect?: InspectResult;
}
