#!/usr/bin/env node
import { watch as fsWatch } from "node:fs";
import { createServer } from "node:http";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { associate, openRdoc } from "./associate.js";
import { loadRdocConfig, mergeBuildOptions } from "./config.js";
import { buildRdoc } from "./compiler.js";
import { DEMO_MARKDOWN } from "./demo.js";
import type { BuildOptions, RdocProfile } from "./types.js";
import { RDOC_VERSION } from "./types.js";
import { inspectRdoc, validateRdoc } from "./validator.js";

const program = new Command();

program
  .name("rdoc")
  .description("CLI for .rdoc — self-contained responsive offline documents")
  .version(RDOC_VERSION);

async function runBuild(
  input: string,
  opts: Record<string, string | boolean | undefined>,
): Promise<void> {
  const { config } = await loadRdocConfig(path.dirname(path.resolve(input)));
  const merged = mergeBuildOptions(config, {
    title: opts.title as string | undefined,
    author: opts.author as string | undefined,
    lang: opts.lang as string | undefined,
    description: opts.description as string | undefined,
    profile: opts.profile as RdocProfile | undefined,
    canonicalUrl: opts.canonicalUrl as string | undefined,
    license: opts.license as string | undefined,
    rights: opts.rights as string | undefined,
    created: opts.created as string | undefined,
    themeAccent: opts.themeAccent as string | undefined,
  });

  const buildOpts: BuildOptions = {
    inputPath: input,
    outputPath: (opts.output as string) || config.output || "output.rdoc.html",
    title: merged.title,
    author: merged.author,
    lang: merged.lang,
    description: merged.description,
    profile: merged.profile,
    canonicalUrl: merged.canonicalUrl,
    license: merged.license,
    rights: merged.rights,
    created: merged.created as string | undefined,
    themeAccent: merged.themeAccent,
  };

  const result = await buildRdoc(buildOpts);
  const kb = (result.bytes / 1024).toFixed(1);
  console.log(`✓ Built: ${result.outputPath} (${kb} KB)`);
  console.log(`  title:  ${result.manifest.title}`);
  console.log(`  hash:   ${result.manifest.contentHash}`);
  console.log(
    `  words:  ${result.manifest.wordCount} (~${result.manifest.readingMinutes} min)`,
  );
}

program
  .command("build")
  .description("Compile Markdown into a self-contained .rdoc / .rdoc.html")
  .argument("<input>", "Input Markdown (.md)")
  .option("-o, --output <file>", "Output file", "output.rdoc.html")
  .option("-t, --title <title>", "Document title")
  .option("-a, --author <author>", "Author")
  .option("-l, --lang <lang>", "Language (BCP 47)")
  .option("-d, --description <text>", "Short description")
  .option("--profile <profile>", "article | slides | contract | paper")
  .option("--canonical-url <url>", "Canonical web twin URL")
  .option("--license <spdx>", "SPDX license id")
  .option("--rights <text>", "Rights notice")
  .option("--theme-accent <color>", "CSS accent color (manifest themeAccent)")
  .option("--created <iso>", "Fixed created timestamp (or set SOURCE_DATE_EPOCH)")
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
            console.error("Watch rebuild failed:", err instanceof Error ? err.message : err);
          });
        }, 150);
      });
    } catch (err) {
      console.error("Build error:", err instanceof Error ? err.message : err);
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
      // 2 = integrity/structure; distinguish parse failures already in errors
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
        console.log(`  Next: node dist/cli.js build ${path.basename(out)} -o my_article.rdoc.html`);
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

program.parse();
