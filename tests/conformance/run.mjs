#!/usr/bin/env node
/**
 * RDOC conformance suite runner.
 * Exit 0 only when every fixture matches its expected pass/fail outcome.
 */
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");
const DIST_VALIDATOR = path.resolve(__dirname, "../../dist/validator.js");

const CSP_RE =
  /<meta\s+[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i;
const ARTICLE_RDOC_RE = /<article\b[^>]*\bid\s*=\s*["']rdoc-content["'][^>]*>/gi;
const MANIFEST_RE =
  /<script\s+type="application\/rdoc\+json"[^>]*>([\s\S]*?)<\/script>/i;
const CONTENT_RE =
  /<article\s+id="rdoc-content"[^>]*>([\s\S]*?)<\/article>/i;

/** @typedef {{ name: string; expectPass: boolean; checks: string[] }} Case */

/** @type {Case[]} */
const CASES = [
  {
    name: "valid-minimal.rdoc.html",
    expectPass: true,
    checks: ["csp", "single-article", "hash"],
  },
  {
    name: "fail-bad-hash.rdoc.html",
    expectPass: false,
    checks: ["csp", "single-article", "hash"],
  },
  {
    name: "fail-no-csp.rdoc.html",
    expectPass: false,
    checks: ["csp", "single-article", "hash"],
  },
  {
    name: "fail-multi-article.rdoc.html",
    expectPass: false,
    checks: ["csp", "single-article", "hash"],
  },
];

function normalizeForHash(text) {
  const nfc = text.normalize("NFC");
  const lf = nfc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return lf.trim();
}

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

function hasCsp(html) {
  return CSP_RE.test(html);
}

function countRdocArticles(html) {
  const matches = html.match(ARTICLE_RDOC_RE);
  return matches ? matches.length : 0;
}

function extractManifest(html) {
  const match = html.match(MANIFEST_RE);
  if (!match) throw new Error("manifest missing");
  return JSON.parse(match[1].trim());
}

function extractContentHtml(html) {
  const match = html.match(CONTENT_RE);
  if (!match) throw new Error("article#rdoc-content missing");
  return match[1];
}

async function loadDistValidator() {
  try {
    await access(DIST_VALIDATOR);
    return import(pathToFileURL(DIST_VALIDATOR).href);
  } catch {
    return null;
  }
}

/**
 * @param {string} html
 * @param {Awaited<ReturnType<typeof loadDistValidator>>} dist
 */
function verifyHash(html, dist) {
  const manifest = extractManifest(html);
  const expected = String(manifest.contentHash || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(expected)) return false;

  if (dist?.verifyContentHash) {
    return dist.verifyContentHash(html, expected);
  }
  if (dist?.hashArticleContent) {
    const inner = extractContentHtml(html);
    return dist.hashArticleContent(inner) === expected;
  }

  const inner = extractContentHtml(html);
  return sha256Hex(normalizeForHash(inner)) === expected;
}

/**
 * @param {Case} c
 * @param {string} html
 * @param {Awaited<ReturnType<typeof loadDistValidator>>} dist
 */
function evaluateCase(c, html, dist) {
  /** @type {string[]} */
  const failures = [];

  if (c.checks.includes("csp") && !hasCsp(html)) {
    failures.push("missing CSP meta");
  }

  if (c.checks.includes("single-article")) {
    const n = countRdocArticles(html);
    if (n !== 1) {
      failures.push(`expected exactly one article#rdoc-content, found ${n}`);
    }
  }

  if (c.checks.includes("hash")) {
    let ok = false;
    try {
      ok = verifyHash(html, dist);
    } catch (err) {
      failures.push(
        `hash check error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (!ok && !failures.some((f) => f.startsWith("hash check error"))) {
      failures.push("contentHash mismatch or invalid");
    }
  }

  const passed = failures.length === 0;
  return { passed, failures };
}

async function main() {
  const dist = await loadDistValidator();
  const mode = dist
    ? "dist/validator.js (hash via reference impl)"
    : "builtin minimal regex + SHA-256 (dist not built)";

  console.log(`RDOC conformance suite`);
  console.log(`Hash backend: ${mode}`);
  console.log("");

  let mismatches = 0;

  for (const c of CASES) {
    const filePath = path.join(FIXTURES, c.name);
    const html = await readFile(filePath, "utf8");
    const { passed, failures } = evaluateCase(c, html, dist);
    const ok = passed === c.expectPass;
    const label = ok ? "OK" : "FAIL";
    const expect = c.expectPass ? "pass" : "fail";
    const got = passed ? "pass" : "fail";

    console.log(`[${label}] ${c.name} (expect ${expect}, got ${got})`);
    if (!ok) {
      mismatches += 1;
      for (const f of failures) console.log(`       - ${f}`);
      if (passed && !c.expectPass) {
        console.log("       - fixture was expected to fail but passed all checks");
      }
    } else if (!passed) {
      for (const f of failures) console.log(`       · ${f}`);
    }
  }

  console.log("");
  if (mismatches > 0) {
    console.error(`${mismatches} case(s) did not match expected outcomes.`);
    process.exitCode = 1;
    return;
  }
  console.log("All conformance outcomes matched.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
