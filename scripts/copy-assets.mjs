import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "src", "template");
const to = path.join(root, "dist", "template");

mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("Copied template assets → dist/template");
