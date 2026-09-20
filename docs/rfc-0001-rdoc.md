# RFC 0001: Responsive Document (`.rdoc`) Format

- **Status:** Accepted
- **Version:** 1.1.0
- **Created:** 2026-09-20
- **Accepted:** 2026-09-20 (community review completed for MVP; errata and clarifications still welcome)
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
| Annotations | Optional highlights / ranges, sidecar or embedded (see §17) |
| Book spine | Multi-part catalog file `*.rdoc.book.json` (see §18) |

## 4. Media type and extensions

| Item | Value |
| --- | --- |
| Preferred media type | `application/vnd.rdoc+html` |
| Compatible fallback | `text/html; charset=utf-8` |
| Canonical extension | `.rdoc` |
| Interop extension | `.rdoc.html` (recommended for messengers / OS without association) |

Producers SHOULD emit `.rdoc.html` when distributing to unknown readers. Producers MAY emit `.rdoc` when the OS association is registered (see §11).

Registration path notes: [IANA-MEDIA-TYPE.md](./IANA-MEDIA-TYPE.md).

## 5. File encoding and structure

### 5.1 Encoding

- Files MUST be UTF-8.
- A leading UTF-8 BOM SHOULD NOT be used.
- Line endings in the stored file MAY be LF or CRLF.
- Before hashing, implementations MUST canonicalize article text (see §7): Unicode NFC and newlines → LF.

### 5.2 Required skeleton

```html
<!DOCTYPE html>
<html lang="{BCP47}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; …">
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

Producers SHOULD emit a restrictive CSP meta tag (reference:
`default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; script-src 'unsafe-inline'; …`)
so untrusted documents cannot fetch the network when opened.
### 5.3 Constraints

1. Document MUST be parseable as HTML5.
2. MUST NOT require network access for primary reading (text, images, styles, scripts used by the reader).
3. MUST NOT include external stylesheet or script URLs (`http:`, `https:`, protocol-relative).
4. Images in the article MUST be `data:` URIs or inline SVG. Relative file references are allowed only in **source** Markdown before compile-time inlining.
5. The element `<article id="rdoc-content">` MUST appear exactly once.
6. Manifest script MUST use `type="application/rdoc+json"`.

## 6. Manifest

### 6.1 Schema (version 1.1.0)

```json
{
  "format": "rdoc",
  "version": "1.1.0",
  "title": "string",
  "author": "string",
  "created": "ISO-8601 timestamp",
  "lang": "BCP-47 language tag",
  "contentHash": "64 lowercase hex chars (SHA-256)",
  "readingMinutes": 1,
  "wordCount": 0,
  "description": "optional string",
  "profile": "article",
  "canonicalUrl": "https://example.org/docs/guide",
  "license": "MIT",
  "rights": "© 2026 Example Org. All rights reserved."
}
```

Extended example: [examples/manifest-extended.json](./examples/manifest-extended.json).

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
| `profile` | no | Document shape hint: `"article"` \| `"slides"` \| `"contract"` \| `"paper"` (default if omitted: `"article"`) |
| `canonicalUrl` | no | Absolute URI of the canonical publication location |
| `license` | no | SPDX license identifier string (e.g. `"MIT"`, `"CC-BY-4.0"`) |
| `rights` | no | Free-text rights / copyright notice |

### 6.2 Version negotiation

1. Readers MUST parse the manifest as JSON and require `format === "rdoc"`.
2. Readers MUST ignore unknown manifest fields (forward compatibility). Producers MAY add vendor-prefixed or experimental keys; ignoring unknowns is mandatory, not advisory.
3. Readers MUST accept documents whose `version` has a higher MINOR or PATCH than the reader implements, provided required 1.x fields are present and valid.
4. Readers MAY refuse documents whose MAJOR version is greater than the reader supports.
5. Optional fields introduced in 1.1.0 (`profile`, `canonicalUrl`, `license`, `rights`) MUST NOT affect `contentHash` computation.

## 7. Integrity (contentHash)

1. Let `inner` be the character sequence inside `<article id="rdoc-content">…</article>`.
2. Canonicalize `inner`:
   1. Apply Unicode Normalization Form **NFC**.
   2. Replace all CRLF (`U+000D U+000A`) and lone CR (`U+000D`) with LF (`U+000A`).
   3. Trim leading and trailing ASCII whitespace (`U+0009`, `U+000A`, `U+000D`, `U+0020`).
3. Encode the canonical string as UTF-8 bytes.
4. `contentHash = hex(SHA-256(bytes))` using lowercase hexadecimal (`0-9a-f`).
5. Validators MUST recompute with the same canonicalization; mismatch MUST be reported as integrity failure.

This canonicalization ensures `contentHash` is stable across Windows/macOS/Linux editors and Git `core.autocrlf` checkouts when the visible text is unchanged.

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
- Producers SHOULD embed a restrictive Content-Security-Policy meta tag that disables network access (`default-src 'none'`, `connect-src 'none'`) while allowing inline reader CSS/JS and `data:` images.
- Compilers MUST reject external image/script/style URLs and SHOULD strip `<script>`, `<iframe>`, and inline event handlers from article HTML before packaging.
- Print stylesheets SHOULD hide all reader chrome (`.rdoc-chrome`) so UI chrome never appears in PDF/paper output.
- Future revisions MAY add optional detached signatures (e.g. Ed25519 over `contentHash`) — out of scope for 1.0.0 / 1.1.0.
- Do not execute arbitrary user Markdown as code beyond HTML produced by a vetted pipeline.
- Annotation and book-spine sidecars (see §17–§18) are untrusted JSON; readers MUST NOT treat their contents as executable code and MUST ignore unknown fields.
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

Format history: [CHANGELOG-FORMAT.md](./CHANGELOG-FORMAT.md).

## 14. Reference implementation

This repository provides:

- TypeScript CLI: `build`, `inspect`, `serve`, `open`, `associate`, `init`
- Reader template under `src/template/`
- Obsidian export plugin under `plugins/obsidian-rdoc/`

## 15. Future work

- Optional digital signatures and key IDs in the manifest
- Richer annotation UX (threaded comments, shared sync) beyond the minimal schema in §17
- Pandoc writer / reader
- Browser extension “Save as .rdoc”
- Native OS viewers beyond “open in browser”

## 16. IANA considerations

Media type `application/vnd.rdoc+html` is proposed for vendor registration. Until registered, implementations MAY serve `text/html`. See [IANA-MEDIA-TYPE.md](./IANA-MEDIA-TYPE.md).

## 17. Sidecar and embedded annotations

Annotations are optional. They do not participate in `contentHash`. Readers that do not implement annotations MUST ignore them.

Detail and examples: [annotations.md](./annotations.md).

### 17.1 Carriage

Annotations MAY be provided in either of the following forms (producers SHOULD pick one per document; if both are present, the embedded form takes precedence):

1. **Sidecar file** named `{basename}.rdoc.ann.json` next to `{basename}.rdoc` or `{basename}.rdoc.html` (e.g. `guide.rdoc.ann.json` beside `guide.rdoc.html`).
2. **Embedded script** in the document:

```html
<script type="application/rdoc-annotations+json" id="rdoc-annotations">
{annotations-json}
</script>
```

### 17.2 Minimal schema

```json
{
  "version": "1.0.0",
  "documentHash": "optional 64 lowercase hex chars matching contentHash",
  "highlights": [
    {
      "id": "hl-1",
      "startPath": "optional CSS/DOM path hint",
      "startOffset": 0,
      "endOffset": 12,
      "text": "optional quoted excerpt",
      "color": "optional color token or CSS color",
      "created": "optional ISO-8601 timestamp"
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `version` | yes | SemVer of the annotations schema |
| `documentHash` | no | If present, SHOULD match the document `contentHash`; mismatch MAY warn |
| `highlights` | yes | Array (MAY be empty) |
| `highlights[].id` | yes | Stable unique string within the file |
| `highlights[].startPath` | no | Locator hint for the start node |
| `highlights[].startOffset` | no | Character offset within the located text node / range |
| `highlights[].endOffset` | no | End character offset |
| `highlights[].text` | no | Snapshot of highlighted text for display if the DOM moved |
| `highlights[].color` | no | Presentation hint |
| `highlights[].created` | no | When the highlight was created |

Readers MUST ignore unknown fields in the annotations object and in each highlight. Example: [examples/annotations.example.json](./examples/annotations.example.json).

## 18. Multi-article / book profile

A **book** is a ordered catalog of `.rdoc` / `.rdoc.html` parts, not a single hashed article. Detail: [book-profile.md](./book-profile.md).

### 18.1 Spine file

Producers MAY ship a spine file named `*.rdoc.book.json` (e.g. `handbook.rdoc.book.json`) with:

```json
{
  "format": "rdoc-book",
  "version": "1.0.0",
  "title": "Handbook",
  "parts": [
    { "href": "01-intro.rdoc.html", "title": "Introduction" },
    { "href": "02-setup.rdoc.html", "title": "Setup" }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `format` | yes | Constant `"rdoc-book"` |
| `version` | yes | SemVer of the book spine schema |
| `title` | yes | Collection title |
| `parts` | yes | Ordered array; MUST have at least one entry |
| `parts[].href` | yes | Relative URI to a `.rdoc` or `.rdoc.html` part |
| `parts[].title` | yes | Human title for the part (MAY differ from the part manifest `title`) |

Readers MUST ignore unknown spine fields and unknown keys on each part. Individual parts remain ordinary RDOC documents with their own manifests and `contentHash` values. Example: [examples/book.spine.example.json](./examples/book.spine.example.json).

When a part’s manifest sets `"profile": "article"` (or omits `profile`), it is a normal chapter. Other profile values (`slides`, `contract`, `paper`) MAY be used for specialized parts; readers MAY adapt chrome accordingly but MUST still render the article region.
