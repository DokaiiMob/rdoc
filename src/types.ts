/** RDOC format version embedded in every document. */
export const RDOC_VERSION = "1.0.0";

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
}

export interface BuildOptions {
  inputPath: string;
  outputPath: string;
  title?: string;
  author?: string;
  lang?: string;
  description?: string;
}

export interface InspectResult {
  manifest: RdocManifest;
  fileSize: number;
  hashValid: boolean;
  path: string;
}
