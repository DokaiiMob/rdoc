import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const template = path.join(root, "src", "template");
const outDir = path.join(root, "plugins", "obsidian-rdoc", "src");
mkdirSync(outDir, { recursive: true });

const css = readFileSync(path.join(template, "reader.css"), "utf8");
const js = readFileSync(path.join(template, "runtime.js"), "utf8");

const body = `/* Auto-generated from src/template — do not edit by hand */
export const RDOC_VERSION = "1.1.0";
export const READER_CSS: string = ${JSON.stringify(css)};
export const READER_JS: string = ${JSON.stringify(js)};
`;

writeFileSync(path.join(outDir, "assets.ts"), body, "utf8");
console.log("Synced template → plugins/obsidian-rdoc/src/assets.ts");
