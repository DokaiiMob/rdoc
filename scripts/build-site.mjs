import * as esbuild from "esbuild";
import {
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
  cpSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteSrc = path.join(root, "site");
const outDir = path.join(root, "docs"); // GitHub Pages only allows / or /docs
const assets = path.join(outDir, "assets");
mkdirSync(assets, { recursive: true });

// Ensure PWA icons exist under site/icons
execFileSync(process.execPath, [path.join(root, "scripts", "gen-site-icons.mjs")], {
  cwd: root,
  stdio: "inherit",
});

await esbuild.build({
  entryPoints: [path.join(siteSrc, "src", "main.ts")],
  bundle: true,
  outfile: path.join(assets, "app.js"),
  format: "iife",
  platform: "browser",
  target: "es2022",
  loader: {
    ".css": "text",
    ".js": "text",
  },
  logLevel: "info",
});

copyFileSync(path.join(siteSrc, "index.html"), path.join(outDir, "index.html"));
copyFileSync(path.join(siteSrc, "landing.css"), path.join(outDir, "landing.css"));
copyFileSync(path.join(siteSrc, "manifest.webmanifest"), path.join(outDir, "manifest.webmanifest"));
copyFileSync(path.join(siteSrc, "sw.js"), path.join(outDir, "sw.js"));

const iconsOut = path.join(outDir, "icons");
mkdirSync(iconsOut, { recursive: true });
cpSync(path.join(siteSrc, "icons"), iconsOut, { recursive: true });

const sampleMd = path.join(root, "sample.md");
const demoOut = path.join(outDir, "demo.rdoc.html");
try {
  readFileSync(sampleMd);
} catch {
  execFileSync(process.execPath, [path.join(root, "dist", "cli.js"), "init", "demo"], {
    cwd: root,
    stdio: "inherit",
  });
}
execFileSync(
  process.execPath,
  [path.join(root, "dist", "cli.js"), "build", "sample.md", "-o", demoOut, "--author", "rdoc"],
  { cwd: root, stdio: "inherit" },
);

const demoUrl = "https://dokaiimob.github.io/rdoc/demo.rdoc.html";
const qrOut = path.join(outDir, "demo-qr.svg");
try {
  execFileSync("npx", ["--yes", "qrcode", demoUrl, "-t", "svg", "-o", qrOut], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
} catch {
  writeFileSync(
    qrOut,
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#fff"/>
  <text x="90" y="90" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#14201a">Open demo.rdoc.html</text>
</svg>`,
    "utf8",
  );
}

if (!existsSync(path.join(outDir, "sw.js"))) {
  throw new Error("sw.js missing from docs/ — PWA install will fail");
}

console.log("GitHub Pages site → docs/ (index, converter, demo, QR, PWA shell)");
