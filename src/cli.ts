#!/usr/bin/env node
import { watch as fsWatch } from "node:fs";
import { createServer } from "node:http";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { associate, openRdoc } from "./associate.js";
import { loadRdocConfig } from "./config.js";
import { buildRdoc } from "./compiler.js";
import { DEMO_MARKDOWN } from "./demo.js";
import { diffRdocFiles, formatDiffReport } from "./diff.js";
import { signRdocFile, verifyRdocFile, writeKeyPair } from "./sign.js";
import type { BuildOptions, RdocProfile } from "./types.js";
import { RDOC_VERSION } from "./types.js";
import { inspectRdoc, validateRdoc } from "./validator.js";

const program = new Command();

program
  .name("rdoc")
  .description("CLI for .rdoc — self-contained responsive offline documents")
  .version(RDOC_VERSION);

function parseTags(raw: unknown): string[] | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  return raw.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
}

async function runBuild(
  input: string,
  opts: Record<string, string | boolean | undefined>,
): Promise<void> {
  const { config } = await loadRdocConfig(path.dirname(path.resolve(input)));

  // fail-on-external defaults true; --no-fail-on-external disables.
  // --allow-data-images-only is an alias that forces failOnExternal=true.
  let failOnExternal =
    opts.failOnExternal === undefined
      ? config.failOnExternal !== false
      : Boolean(opts.failOnExternal);
  if (opts.allowDataImagesOnly) failOnExternal = true;

  // Only CLI-provided identity fields go into BuildOptions so front-matter can
  // override rdoc.config.json (CLI > front-matter > config).
  const buildOpts: BuildOptions = {
    inputPath: input,
    outputPath: (opts.output as string) || config.output || "output.rdoc.html",
    title: opts.title as string | undefined,
    author: opts.author as string | undefined,
    lang: opts.lang as string | undefined,
    description: opts.description as string | undefined,
    profile: (opts.profile as RdocProfile | undefined) ?? config.profile,
    canonicalUrl:
      (opts.canonicalUrl as string | undefined) ?? config.canonicalUrl,
    license: (opts.license as string | undefined) ?? config.license,
    rights: (opts.rights as string | undefined) ?? config.rights,
    created: opts.created as string | undefined,
    themeAccent:
      (opts.themeAccent as string | undefined) ?? config.themeAccent,
    tags: parseTags(opts.tags),
    cspReport: Boolean(opts.cspReport),
    assetsDir: (opts.assetsDir as string | undefined) ?? config.assetsDir,
    failOnExternal,
    highlight:
      opts.highlight === undefined
        ? config.highlight !== false
        : Boolean(opts.highlight),
    math:
      opts.math === undefined ? config.math !== false : Boolean(opts.math),
    diagrams:
      opts.diagrams === undefined
        ? config.diagrams !== false
        : Boolean(opts.diagrams),
    bibliography:
      (opts.bibliography as string | undefined) ?? config.bibliography,
    readability: Boolean(opts.readability),
  };

  const result = await buildRdoc(buildOpts);
  const kb = (result.bytes / 1024).toFixed(1);
  console.log(`✓ Built: ${result.outputPath} (${kb} KB)`);
  console.log(`  title:  ${result.manifest.title}`);
  console.log(`  hash:   ${result.manifest.contentHash}`);
  console.log(
    `  words:  ${result.manifest.wordCount} (~${result.manifest.readingMinutes} min)`,
  );
  if (result.manifest.tags?.length) {
    console.log(`  tags:   ${result.manifest.tags.join(", ")}`);
  }
  for (const w of result.warnings) {
    console.warn(`  warning: ${w}`);
  }
}

program
  .command("build")
  .description(
    "Compile Markdown or HTML into a self-contained .rdoc / .rdoc.html",
  )
  .argument("<input>", "Input Markdown (.md) or HTML (.html)")
  .option("-o, --output <file>", "Output file", "output.rdoc.html")
  .option("-t, --title <title>", "Document title")
  .option("-a, --author <author>", "Author")
  .option("-l, --lang <lang>", "Language (BCP 47)")
  .option("-d, --description <text>", "Short description")
  .option("--tags <list>", "Comma-separated tags")
  .option("--profile <profile>", "article | slides | contract | paper")
  .option("--canonical-url <url>", "Canonical web twin URL")
  .option("--license <spdx>", "SPDX license id")
  .option("--rights <text>", "Rights notice")
  .option("--theme-accent <color>", "CSS accent color (manifest themeAccent)")
  .option("--created <iso>", "Fixed created timestamp (or set SOURCE_DATE_EPOCH)")
  .option(
    "--assets-dir <dir>",
    "Root directory for resolving relative images (default: input dir)",
  )
  .option(
    "--fail-on-external",
    "Reject http(s) images; allow only data: and local (default: true)",
  )
  .option(
    "--no-fail-on-external",
    "Allow external http(s) image URLs (not recommended)",
  )
  .option(
    "--allow-data-images-only",
    "Alias: enforce local/data images only (same as default --fail-on-external)",
  )
  .option("--no-highlight", "Disable offline Prism syntax highlighting")
  .option("--no-math", "Disable offline KaTeX math")
  .option("--no-diagrams", "Skip Mermaid/Graphviz compile-time SVG")
  .option("--bibliography <file>", "BibTeX file for [@citekey] citations")
  .option(
    "--readability",
    "HTML input: strip nav/footer/aside chrome (basic extract)",
  )
  .option(
    "--csp-report",
    "Also emit Content-Security-Policy-Report-Only (debug; enforcing CSP unchanged)",
  )
  .option("-w, --watch", "Rebuild on input changes")
  .action(async (input: string, opts) => {
    try {
      await runBuild(input, opts);
      if (!opts.watch) return;

      const abs = path.resolve(input);
      console.log(`Watching ${abs} …`);
      let timer: ReturnType<typeof setTimeout> | undefined;
      fsWatch(abs, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void runBuild(input, opts).catch((err) => {
            console.error(
              "Watch rebuild failed:",
              err instanceof Error ? err.message : err,
            );
          });
        }, 150);
      });
    } catch (err) {
      console.error("Build error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("diff")
  .description(
    "Compare two .rdoc files (manifest fields, contentHash, plain-text line diff)",
  )
  .argument("<a>", "First .rdoc / .rdoc.html")
  .argument("<b>", "Second .rdoc / .rdoc.html")
  .option("--unified", "Show unified text hunks for changed lines (default)", true)
  .option("--no-unified", "Summary only (no line hunks)")
  .action(async (a: string, b: string, opts) => {
    try {
      const diff = await diffRdocFiles(path.resolve(a), path.resolve(b));
      console.log(formatDiffReport(diff, opts.unified !== false));
      if (!diff.hashEqual || !diff.textEqual || diff.manifestDelta.length) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error("Diff error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("inspect")
  .description("Print manifest, size, hash, and reading time")
  .argument("<file>", ".rdoc / .rdoc.html file")
  .action(async (file: string) => {
    try {
      const info = await inspectRdoc(file);
      const m = info.manifest;
      console.log(`File:           ${info.path}`);
      console.log(`Size:           ${(info.fileSize / 1024).toFixed(1)} KB (${info.fileSize} bytes)`);
      console.log(`Format:         ${m.format} v${m.version}`);
      console.log(`Title:          ${m.title}`);
      console.log(`Author:         ${m.author}`);
      console.log(`Created:        ${m.created}`);
      console.log(`Language:       ${m.lang}`);
      console.log(`Words:          ${m.wordCount}`);
      console.log(`Reading:        ~${m.readingMinutes} min`);
      console.log(`SHA-256:        ${m.contentHash}`);
      console.log(`Hash valid:     ${info.hashValid ? "yes ✓" : "NO ✗"}`);
      console.log(`CSP present:    ${info.cspPresent ? "yes ✓" : "NO ✗"}`);
      console.log(`Articles:       ${info.articleCount}`);
      if (m.profile) console.log(`Profile:        ${m.profile}`);
      if (m.canonicalUrl) console.log(`Canonical URL:  ${m.canonicalUrl}`);
      if (m.license) console.log(`License:        ${m.license}`);
      if (m.rights) console.log(`Rights:         ${m.rights}`);
      if (m.tags?.length) console.log(`Tags:           ${m.tags.join(", ")}`);
      if (m.description) console.log(`Description:    ${m.description}`);
      if (!info.hashValid) process.exitCode = 2;
    } catch (err) {
      console.error("Inspect error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("validate")
  .description("Strict CI validation (hash, CSP, single article, manifest)")
  .argument("<file>", ".rdoc / .rdoc.html file")
  .action(async (file: string) => {
    try {
      const result = await validateRdoc(file);
      if (result.ok) {
        console.log(`✓ Valid: ${result.path}`);
        for (const w of result.warnings) console.log(`  warning: ${w}`);
        process.exitCode = 0;
        return;
      }
      console.error(`✗ Invalid: ${result.path}`);
      for (const e of result.errors) console.error(`  - ${e}`);
      for (const w of result.warnings) console.error(`  warning: ${w}`);
      process.exitCode = 2;
    } catch (err) {
      console.error("Validate error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("serve")
  .description("Local preview of a .rdoc in the browser")
  .argument("<file>", ".rdoc / .rdoc.html file")
  .option("-p, --port <port>", "Port", "4173")
  .action(async (file: string, opts) => {
    try {
      const abs = path.resolve(file);
      await access(abs);
      const port = Number(opts.port) || 4173;
      const html = await readFile(abs);

      const server = createServer((_req, res) => {
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": html.byteLength,
          "Cache-Control": "no-store",
        });
        res.end(html);
      });

      server.listen(port, () => {
        console.log(`Preview: http://127.0.0.1:${port}`);
        console.log(`File:    ${abs}`);
        console.log("Ctrl+C to stop");
      });
    } catch (err) {
      console.error("Serve error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("init")
  .description("Scaffold demo or config")
  .argument("<what>", "demo | config")
  .option("-o, --output <file>", "Output path")
  .action(async (what: string, opts) => {
    try {
      if (what === "demo") {
        const out = path.resolve(opts.output || "sample.md");
        try {
          await access(out);
          console.error(`File already exists: ${out}`);
          process.exitCode = 1;
          return;
        } catch {
          /* ok */
        }
        await writeFile(out, DEMO_MARKDOWN, "utf8");
        console.log(`✓ Demo markdown: ${out}`);
        console.log(
          `  Next: node dist/cli.js build ${path.basename(out)} -o my_article.rdoc.html`,
        );
        return;
      }
      if (what === "config") {
        const out = path.resolve(opts.output || "rdoc.config.json");
        const sample = {
          author: "Anonymous",
          lang: "en",
          license: "MIT",
          profile: "article",
          themeDefault: "system",
          failOnExternal: true,
          highlight: true,
          math: true,
          diagrams: true,
        };
        await writeFile(out, JSON.stringify(sample, null, 2) + "\n", "utf8");
        console.log(`✓ Config written: ${out}`);
        return;
      }
      console.error("Supported: rdoc init demo | rdoc init config");
      process.exitCode = 1;
    } catch (err) {
      console.error("Init error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("open")
  .description("Open .rdoc in the browser (temp .html when needed)")
  .argument("<file>", ".rdoc / .rdoc.html file")
  .action(async (file: string) => {
    try {
      await openRdoc(file);
      console.log(`✓ Opened: ${path.resolve(file)}`);
    } catch (err) {
      console.error("Open error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("associate")
  .description("Register or remove the .rdoc OS file association")
  .option("--undo", "Remove association")
  .action(async (opts) => {
    try {
      const result = await associate({ undo: Boolean(opts.undo) });
      console.log(`✓ ${result.message}`);
    } catch (err) {
      console.error(
        "Associate error:",
        err instanceof Error ? err.message : err,
      );
      process.exitCode = 1;
    }
  });

program
  .command("keygen")
  .description("Generate an Ed25519 key pair for rdoc sign (RFC 0002)")
  .option("-o, --out-dir <dir>", "Output directory", ".")
  .option("-n, --name <basename>", "File basename", "rdoc")
  .action(async (opts) => {
    try {
      const dir = path.resolve(opts.outDir || ".");
      await mkdir(dir, { recursive: true });
      const result = await writeKeyPair(dir, opts.name || "rdoc");
      console.log(`✓ Private key: ${result.privatePath}`);
      console.log(`  Public key:  ${result.publicPath}`);
      console.log(`  keyId:       ${result.keyId}`);
    } catch (err) {
      console.error("Keygen error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("sign")
  .description("Embed Ed25519 signature over contentHash (RFC 0002)")
  .argument("<file>", ".rdoc / .rdoc.html file")
  .requiredOption("-k, --key <pem>", "Private key PEM (PKCS#8 Ed25519)")
  .action(async (file: string, opts) => {
    try {
      const pem = await readFile(path.resolve(opts.key), "utf8");
      const result = await signRdocFile(file, pem);
      console.log(`✓ Signed: ${result.path}`);
      console.log(`  hash:   ${result.manifest.contentHash}`);
      console.log(`  keyId:  ${result.signature.keyId ?? "(none)"}`);
      console.log(`  alg:    ${result.signature.alg}`);
    } catch (err) {
      console.error("Sign error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("verify")
  .description("Verify contentHash and optional Ed25519 signature (RFC 0002)")
  .argument("<file>", ".rdoc / .rdoc.html file")
  .option("--allow-unsigned", "Succeed when hash is valid but unsigned")
  .action(async (file: string, opts) => {
    try {
      const result = await verifyRdocFile(file, {
        allowUnsigned: Boolean(opts.allowUnsigned),
      });
      if (result.ok && result.status === "signed") {
        console.log(`✓ Signature valid (${result.keyId ?? "no keyId"})`);
        process.exitCode = 0;
        return;
      }
      if (result.ok && result.status === "unsigned") {
        console.log("✓ Hash valid (unsigned)");
        process.exitCode = 0;
        return;
      }
      if (!result.ok) {
        console.error(`✗ Verify failed: ${result.detail}`);
        process.exitCode = result.status === "hash-fail" ? 2 : 3;
      }
    } catch (err) {
      console.error("Verify error:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program.parse();
