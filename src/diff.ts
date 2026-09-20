/**
 * Compare two .rdoc files: manifests, contentHash, and plain-text line diff.
 */

import { readFile } from "node:fs/promises";
import {
  extractContentHtml,
  extractManifest,
} from "./validator.js";
import type { RdocManifest } from "./types.js";

export interface DiffLine {
  type: "equal" | "add" | "remove";
  text: string;
  aLine?: number;
  bLine?: number;
}

export interface RdocDiffResult {
  pathA: string;
  pathB: string;
  manifestA: RdocManifest;
  manifestB: RdocManifest;
  hashEqual: boolean;
  manifestDelta: { field: string; a: unknown; b: unknown }[];
  textEqual: boolean;
  lines: DiffLine[];
  summary: { equal: number; add: number; remove: number };
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Simple LCS-based line diff (fine for article-sized texts). */
export function lineDiff(aText: string, bText: string): DiffLine[] {
  const a = aText.split("\n");
  const b = bText.split("\n");
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let aLine = 1;
  let bLine = 1;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "equal", text: a[i], aLine, bLine });
      i++;
      j++;
      aLine++;
      bLine++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "remove", text: a[i], aLine });
      i++;
      aLine++;
    } else {
      out.push({ type: "add", text: b[j], bLine });
      j++;
      bLine++;
    }
  }
  while (i < n) {
    out.push({ type: "remove", text: a[i], aLine });
    i++;
    aLine++;
  }
  while (j < m) {
    out.push({ type: "add", text: b[j], bLine });
    j++;
    bLine++;
  }
  return out;
}

const MANIFEST_COMPARE_KEYS = [
  "title",
  "author",
  "lang",
  "description",
  "profile",
  "canonicalUrl",
  "license",
  "rights",
  "themeAccent",
  "tags",
  "wordCount",
  "readingMinutes",
  "version",
] as const;

export async function diffRdocFiles(
  pathA: string,
  pathB: string,
): Promise<RdocDiffResult> {
  const [rawA, rawB] = await Promise.all([
    readFile(pathA, "utf8"),
    readFile(pathB, "utf8"),
  ]);
  const manifestA = extractManifest(rawA);
  const manifestB = extractManifest(rawB);
  const contentA = extractContentHtml(rawA);
  const contentB = extractContentHtml(rawB);
  const plainA = htmlToPlain(contentA);
  const plainB = htmlToPlain(contentB);
  const lines = lineDiff(plainA, plainB);

  const manifestDelta: RdocDiffResult["manifestDelta"] = [];
  for (const key of MANIFEST_COMPARE_KEYS) {
    const a = manifestA[key];
    const b = manifestB[key];
    const same =
      JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    if (!same) manifestDelta.push({ field: key, a, b });
  }

  const summary = { equal: 0, add: 0, remove: 0 };
  for (const l of lines) summary[l.type]++;

  return {
    pathA,
    pathB,
    manifestA,
    manifestB,
    hashEqual: manifestA.contentHash === manifestB.contentHash,
    manifestDelta,
    textEqual: plainA === plainB,
    lines,
    summary,
  };
}

export function formatDiffReport(diff: RdocDiffResult, unified = true): string {
  const out: string[] = [];
  out.push(`--- ${diff.pathA}`);
  out.push(`+++ ${diff.pathB}`);
  out.push(`contentHash: ${diff.hashEqual ? "equal" : "DIFFER"}`);
  out.push(
    `  a: ${diff.manifestA.contentHash}`,
  );
  out.push(
    `  b: ${diff.manifestB.contentHash}`,
  );
  if (diff.manifestDelta.length) {
    out.push("manifest:");
    for (const d of diff.manifestDelta) {
      out.push(`  ${d.field}: ${JSON.stringify(d.a)} → ${JSON.stringify(d.b)}`);
    }
  } else {
    out.push("manifest: (compared fields equal)");
  }
  out.push(
    `text: ${diff.textEqual ? "equal" : "DIFFER"} (+${diff.summary.add} -${diff.summary.remove})`,
  );
  if (!diff.textEqual && unified) {
    out.push("---");
    for (const l of diff.lines) {
      if (l.type === "equal") continue;
      const prefix = l.type === "add" ? "+" : "-";
      out.push(`${prefix}${l.text}`);
    }
  }
  return out.join("\n");
}
