import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RdocConfig } from "./types.js";

const CONFIG_NAMES = ["rdoc.config.json", ".rdocrc.json"];

/** Load nearest rdoc.config.json walking up from cwd or startDir. */
export async function loadRdocConfig(
  startDir: string = process.cwd(),
): Promise<{ config: RdocConfig; path?: string }> {
  let dir = path.resolve(startDir);
  for (;;) {
    for (const name of CONFIG_NAMES) {
      const candidate = path.join(dir, name);
      try {
        const raw = await readFile(candidate, "utf8");
        const parsed = JSON.parse(raw) as RdocConfig;
        return { config: parsed, path: candidate };
      } catch {
        /* missing or invalid — keep walking */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { config: {} };
}

export function mergeBuildOptions<T extends Record<string, unknown>>(
  config: RdocConfig,
  opts: T,
): T & RdocConfig {
  return {
    author: config.author,
    lang: config.lang,
    title: config.title,
    description: config.description,
    profile: config.profile,
    canonicalUrl: config.canonicalUrl,
    license: config.license,
    rights: config.rights,
    themeAccent: config.themeAccent,
    ...Object.fromEntries(
      Object.entries(opts).filter(([, v]) => v !== undefined && v !== null),
    ),
  } as T & RdocConfig;
}
