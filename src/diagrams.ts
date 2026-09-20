/**
 * Compile-time Mermaid / Graphviz → inline SVG.
 * Requires optional tools on PATH:
 *   - mmdc (@mermaid-js/mermaid-cli) or npx @mermaid-js/mermaid-cli
 *   - dot (graphviz)
 * When unavailable, fences are left as code blocks with a console warning.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { escapeHtml } from "./md-ext.js";

export interface DiagramResult {
  markdown: string;
  warnings: string[];
  replaced: number;
}

function runCmd(
  cmd: string,
  args: string[],
  input?: string,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      shell: true,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });
    child.on("error", (err) => {
      resolve({ ok: false, stdout, stderr: err.message });
    });
    child.on("close", (code) => {
      resolve({ ok: code === 0, stdout, stderr });
    });
    if (input !== undefined) {
      child.stdin.write(input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

async function which(bin: string): Promise<boolean> {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = await runCmd(probe, [bin]);
  return r.ok;
}

async function renderMermaid(source: string): Promise<string | null> {
  const dir = await mkdtemp(path.join(tmpdir(), "rdoc-mmd-"));
  const inFile = path.join(dir, "in.mmd");
  const outFile = path.join(dir, "out.svg");
  try {
    await writeFile(inFile, source, "utf8");
    const hasMmdc = await which("mmdc");
    const result = hasMmdc
      ? await runCmd("mmdc", ["-i", inFile, "-o", outFile, "-b", "transparent"])
      : await runCmd("npx", [
          "--yes",
          "@mermaid-js/mermaid-cli",
          "-i",
          inFile,
          "-o",
          outFile,
          "-b",
          "transparent",
        ]);
    if (!result.ok) return null;
    const svg = await readFile(outFile, "utf8");
    return sanitizeSvg(svg);
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function renderDot(source: string): Promise<string | null> {
  const hasDot = await which("dot");
  if (!hasDot) return null;
  const result = await runCmd("dot", ["-Tsvg"], source);
  if (!result.ok) return null;
  return sanitizeSvg(result.stdout);
}

/** Strip scripts / event handlers from SVG for CSP safety. */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

const FENCE_RE =
  /```(mermaid|dot|graphviz)\s*\n([\s\S]*?)```/gi;

export async function processDiagrams(md: string): Promise<DiagramResult> {
  const warnings: string[] = [];
  let replaced = 0;
  const matches = [...md.matchAll(FENCE_RE)];
  if (matches.length === 0) {
    return { markdown: md, warnings, replaced };
  }

  let out = md;
  // Replace from end to keep indices stable
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const kind = m[1].toLowerCase();
    const body = m[2].trim();
    const start = m.index!;
    const end = start + m[0].length;

    let svg: string | null = null;
    if (kind === "mermaid") {
      svg = await renderMermaid(body);
      if (!svg) {
        warnings.push(
          "Mermaid CLI (mmdc / @mermaid-js/mermaid-cli) not available — left mermaid fence as code.",
        );
      }
    } else {
      svg = await renderDot(body);
      if (!svg) {
        warnings.push(
          "Graphviz `dot` not on PATH — left graphviz/dot fence as code.",
        );
      }
    }

    if (svg) {
      replaced++;
      const block = `\n\n<figure class="rdoc-diagram" data-kind="${escapeHtml(kind)}">${svg}</figure>\n\n`;
      out = out.slice(0, start) + block + out.slice(end);
    }
  }

  return { markdown: out, warnings: [...new Set(warnings)], replaced };
}
