# RFC 0001: Responsive Document (`.rdoc`) Format

- **Status:** Draft
- **Version:** 1.0.0
- **Created:** 2026-09-20
- **License:** MIT (specification text and reference implementation)

## 1. Abstract

`.rdoc` (Responsive Document) is a self-contained, UTF-8, HTML-compatible document container for long-form offline reading. It is designed to reflow on mobile viewports, require no network, and open in any modern browser without a proprietary reader.

## 2. Motivation

PDF optimizes for fixed page geometry (e.g. A4). On smartphones this forces pinch-zoom and horizontal scrolling. Ordinary HTML pages reflow well but typically depend on CDNs, webfonts, and trackers, and are not a single portable file.

`.rdoc` combines:

1. **Autonomy** — one file, no external fetches required to read.
2. **Reflow** — CSS-driven responsive typography.
3. **Integrity** — SHA-256 of semantic content in an embedded manifest.
4. **Zero-friction open** — valid HTML polyglot; dual extension `.rdoc.html` works everywhere.

## 3. Terminology

| Term | Meaning |
| --- | --- |
| Document | A single `.rdoc` or `.rdoc.html` file |
| Manifest | JSON metadata in `application/rdoc+json` |
| Article | Semantic body in `<article id="rdoc-content">` |
| Reader chrome | In-document UI (TOC, font controls, theme, print) |
| Polyglot | File that is both a valid HTML document and an RDOC container |

## 4. Media type and extensions

| Item | Value |
| --- | --- |
| Preferred media type | `application/vnd.rdoc+html` |
| Compatible fallback | `text/html; charset=utf-8` |
| Canonical extension | `.rdoc` |
| Interop extension | `.rdoc.html` (recommended for messengers / OS without association) |

Producers SHOULD emit `.rdoc.html` when distributing to unknown readers. Producers MAY emit `.rdoc` when the OS association is registered (see §11).

## 5. File encoding and structure

### 5.1 Encoding

- Files MUST be UTF-8.
- A leading UTF-8 BOM SHOULD NOT be used.
- Line endings MAY be LF or CRLF; validators MUST treat them as significant for hashing (hash the exact article bytes as stored).

### 5.2 Required skeleton

```html
<!DOCTYPE html>
<html lang="{BCP47}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <script type="application/rdoc+json" id="rdoc-manifest">
  {manifest-json}
  </script>
  <style>/* embedded reader CSS */</style>
</head>
<body>
  <!-- optional reader chrome -->
  <article id="rdoc-content">
    <!-- semantic content ONLY; this region is hashed -->
  </article>
  <script>/* optional micro-runtime ≤ 10 KiB recommended */</script>
</body>
</html>
```

### 5.3 Constraints

1. Document MUST be parseable as HTML5.
2. MUST NOT require network access for primary reading (text, images, styles, scripts used by the reader).
3. MUST NOT include external stylesheet or script URLs (`http:`, `https:`, protocol-relative).
4. Images in the article MUST be `data:` URIs or inline SVG. Relative file references are allowed only in **source** Markdown before compile-time inlining.
5. The element `<article id="rdoc-content">` MUST appear exactly once.
6. Manifest script MUST use `type="application/rdoc+json"`.

## 6. Manifest

### 6.1 Schema (version 1.0.0)

```json
{
  "format": "rdoc",
  "version": "1.0.0",
  "title": "string",
  "author": "string",
  "created": "ISO-8601 timestamp",
  "lang": "BCP-47 language tag",
  "contentHash": "64 lowercase hex chars (SHA-256)",
  "readingMinutes": 1,
  "wordCount": 0,
  "description": "optional string"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `format` | yes | Constant `"rdoc"` |
| `version` | yes | SemVer of the format dialect |
| `title` | yes | Human title |
| `author` | yes | May be `"Anonymous"` |
| `created` | yes | ISO-8601, preferably UTC with `Z` |
| `lang` | yes | Document language |
| `contentHash` | yes | See §7 |
| `readingMinutes` | yes | Integer ≥ 1 |
| `wordCount` | yes | Integer ≥ 0 |
| `description` | no | Short summary |

Unknown fields SHOULD be ignored by readers (forward compatibility).

## 7. Integrity (contentHash)

1. Let `inner` be the exact character sequence inside `<article id="rdoc-content">…</article>`, with leading and trailing ASCII whitespace trimmed.
2. Encode `inner` as UTF-8 bytes.
3. `contentHash = hex(SHA-256(bytes))` using lowercase hexadecimal (`0-9a-f`).
4. Validators MUST recompute and compare; mismatch MUST be reported as integrity failure.

Readers MAY still display content if the hash fails, but MUST surface a warning when possible (CLI `inspect` exits non-zero).

## 8. Semantics and accessibility

- Prefer semantic HTML: `h1–h6`, `p`, `ul/ol`, `blockquote`, `pre/code`, `table`, `figure`, `aside`.
- Footnote UX SHOULD use in-page popovers rather than only end-of-document jumps (reference implementation uses `.rdoc-fn-ref` buttons).
- Measure: body column SHOULD target approximately 65–75 characters at default font size.
- Fonts: system stacks only in the reference CSS (no remote webfonts).

## 9. Reader capabilities (recommended)

Reference chrome MAY provide:

- Table of contents from `h2`/`h3`
- Reading progress indicator
- Font size adjustment (persisted locally)
- Light / dark / system theme
- Print stylesheet and a control that invokes `window.print()` (PDF via OS dialog)

Runtime SHOULD stay small (reference target: ≤ 10 KiB of JS before gzip).

## 10. Security considerations

- Treat documents as untrusted HTML. Opening in a browser grants normal web origin privileges for `file://` or whatever origin serves the file.
- Compilers MUST reject external image/script/style URLs to reduce tracking and mixed-content surprises when later hosted.
- Future revisions MAY add optional detached signatures (e.g. Ed25519 over `contentHash`) — out of scope for 1.0.0.
- Do not execute arbitrary user Markdown as code beyond HTML produced by a vetted pipeline.

## 11. OS file association

| Platform | Mechanism |
| --- | --- |
| Windows | `HKCU\Software\Classes\.rdoc` → ProgID opening via `rdoc open` |
| Linux | Shared MIME info `application/vnd.rdoc+html` + `.desktop` handler |
| macOS | UTI / `duti` or Launch Services handler → `rdoc open` |

`rdoc open` MUST ensure the browser receives HTML semantics (e.g. copy `.rdoc` to a temporary `.rdoc.html` before invoking the system opener).

CLI: `rdoc associate` / `rdoc associate --undo`.

## 12. Compilation profile (informative)

Reference compiler pipeline:

1. Optional callout / footnote preprocessing
2. Markdown → HTML (GFM)
3. Inline local images as `data:` URIs
4. Reject remaining external resources
5. Build article inner HTML + manifest
6. Embed CSS/JS template
7. Write UTF-8 file

## 13. Versioning

- Format `version` follows SemVer.
- Breaking changes to required structure or hash algorithm bump MAJOR.
- Additive manifest fields bump MINOR.
- Clarifications only bump PATCH.

## 14. Reference implementation

This repository provides:

- TypeScript CLI: `build`, `inspect`, `serve`, `open`, `associate`, `init`
- Reader template under `src/template/`
- Obsidian export plugin under `plugins/obsidian-rdoc/`

## 15. Future work

- Optional digital signatures and key IDs in the manifest
- Annotation layer (highlights) as sidecar or embedded JSON
- Pandoc writer / reader
- Browser extension “Save as .rdoc”

## 16. IANA considerations

Media type `application/vnd.rdoc+html` is proposed for vendor registration. Until registered, implementations MAY serve `text/html`.
