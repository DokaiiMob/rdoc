/**
 * Minimal YAML front-matter extractor (no heavy deps).
 * Supports: scalars, quoted strings, boolean/null, simple string arrays.
 */

export interface FrontMatterMeta {
  title?: string;
  author?: string;
  description?: string;
  lang?: string;
  tags?: string[];
  license?: string;
  rights?: string;
  profile?: string;
  canonicalUrl?: string;
  themeAccent?: string;
  /** Unparsed leftover keys (forward-compatible). */
  [key: string]: unknown;
}

export interface FrontMatterResult {
  meta: FrontMatterMeta;
  body: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function unquote(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function parseScalar(raw: string): unknown {
  const v = raw.trim();
  if (v === "" || v === "~" || v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return unquote(v);
}

function parseInlineArray(raw: string): string[] {
  const inner = raw.trim().slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(",").map((p) => String(parseScalar(p)));
}

/** Parse a tiny YAML subset used in Markdown front-matter. */
export function parseSimpleYaml(yaml: string): FrontMatterMeta {
  const meta: FrontMatterMeta = {};
  const lines = yaml.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i++;
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1];
    const rest = kv[2].trim();

    if (rest === "" || rest === "|" || rest === ">") {
      // Block scalar or list
      const items: string[] = [];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        const listItem = next.match(/^\s+-\s+(.*)$/);
        if (listItem) {
          items.push(String(parseScalar(listItem[1])));
          i++;
          continue;
        }
        const indented = next.match(/^\s+(.+)$/);
        if (indented && (rest === "|" || rest === ">")) {
          items.push(indented[1]);
          i++;
          continue;
        }
        break;
      }
      if (items.length) {
        meta[key] = key === "tags" || Array.isArray(meta[key]) ? items : items.join("\n");
      } else {
        meta[key] = "";
      }
      continue;
    }

    if (rest.startsWith("[") && rest.endsWith("]")) {
      meta[key] = parseInlineArray(rest);
      i++;
      continue;
    }

    meta[key] = parseScalar(rest);
    i++;
  }

  // Normalize common fields
  const tagsRaw: unknown = meta.tags;
  if (Array.isArray(tagsRaw)) {
    meta.tags = tagsRaw.map(String);
  } else if (typeof tagsRaw === "string") {
    meta.tags = tagsRaw.split(/[,;\s]+/).filter(Boolean);
  }

  return meta;
}

/** Strip and parse leading `---` … `---` front-matter. */
export function extractFrontMatter(source: string): FrontMatterResult {
  const m = source.match(FM_RE);
  if (!m) return { meta: {}, body: source };
  return {
    meta: parseSimpleYaml(m[1]),
    body: source.slice(m[0].length),
  };
}
