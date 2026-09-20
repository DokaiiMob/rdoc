# Roadmap

Vision, near-term work, and a large backlog of ideas for growing **`.rdoc`** into a durable open format.  
Contributions welcome — start with [good first issues](https://github.com/DokaiiMob/rdoc/labels/good%20first%20issue).

> **North star:** one file, any phone browser, zero network, honest integrity — without waiting for OS vendors.

---

## Table of contents

1. [Guiding principles](#guiding-principles)
2. [Shipped (MVP → public hardening)](#shipped-mvp--public-hardening)
3. [Near-term (0–3 months)](#near-term-0–3-months)
4. [Format & specification](#format--specification)
5. [Compiler & CLI](#compiler--cli)
6. [Reader UX](#reader-ux)
7. [Security & trust](#security--trust)
8. [Ecosystem & integrations](#ecosystem--integrations)
9. [Authoring & PKM](#authoring--pkm)
10. [Distribution & discovery](#distribution--discovery)
11. [Accessibility & i18n](#accessibility--i18n)
12. [Performance & packaging](#performance--packaging)
13. [Academic & long-form](#academic--long-form)
14. [Legal / business documents](#legal--business-documents)
15. [Community & governance](#community--governance)
16. [Research / speculative](#research--speculative)
17. [Non-goals (for now)](#non-goals-for-now)
18. [How we prioritize](#how-we-prioritize)

---

## Guiding principles

1. **Browser is the reader** — never require a proprietary app to open a document.
2. **Offline by default** — no CDN, no webfonts, no phone-home.
3. **Polyglot first** — valid HTML that degrades gracefully in text editors.
4. **Integrity is boring and correct** — stable `contentHash` across OSes (NFC + LF).
5. **Small runtime** — keep interactive JS tiny; progressive enhancement only.
6. **Zero-friction adoption** — ship `.rdoc.html` until associations are universal.

---

## Shipped (MVP → public hardening)

- [x] TypeScript CLI: `build`, `inspect`, `serve`, `open`, `associate`, `init demo`
- [x] Markdown → self-contained HTML polyglot (`marked` + extensions)
- [x] Local image inlining (`data:`), reject remote images
- [x] Manifest `application/rdoc+json` + SHA-256 `contentHash`
- [x] Canonical hashing: Unicode **NFC** + newlines → **LF**
- [x] Restrictive **CSP** meta on every document
- [x] Article HTML sanitize (`script` / `iframe` / inline handlers)
- [x] Adaptive reader CSS + &lt;10KB vanilla runtime (TOC, progress, theme, font, footnotes, print)
- [x] Print isolation (`.rdoc-chrome` hidden in `@media print`)
- [x] OS association helpers (Windows / Linux / macOS)
- [x] Obsidian export plugin (vault images → base64)
- [x] RFC 0001 draft
- [x] GitHub Pages playground (drag-and-drop MD converter + demo + QR)
- [x] MIT license, public GitHub repo

---

## Near-term (0–3 months)

### Launch & awareness

- [ ] Show HN post + polished landing metrics (demo CTR)
- [ ] Posts: r/ObsidianMD, r/markdown, r/selfhosted, Lobsters
- [ ] Long-form article (dev.to / Hashnode): architecture of the polyglot + CSP + hash
- [ ] Short “PDF vs .rdoc” phone video / GIF for social
- [ ] Add `CONTRIBUTING.md` + Code of Conduct

### Product gaps

- [ ] Publish Obsidian plugin to **Community Plugins** catalog
- [ ] Deterministic `--created` / `SOURCE_DATE_EPOCH` for reproducible builds ([#2](https://github.com/DokaiiMob/rdoc/issues/2))
- [ ] Pandoc writer / Lua filter ([#1](https://github.com/DokaiiMob/rdoc/issues/1))
- [ ] CI: build + `inspect` smoke test on sample fixture
- [ ] `rdoc validate` alias (strict exit codes for CI)
- [ ] English + Russian README sync policy (English canonical)

### Playground

- [ ] Side-by-side real PDF iframe vs generated `.rdoc` (optional user upload)
- [ ] “Share link” via compressed fragment / File System Access API save
- [ ] PWA install of the playground (still offline-capable for convert)

---

## Format & specification

- [ ] **RFC 0001** → `Accepted` after community review window
- [ ] Formal JSON Schema for the manifest (`schemas/rdoc-manifest-1.0.json`)
- [ ] Conformance test suite (fixtures: pass/fail hash, CSP present, single article)
- [ ] Media type IANA notes / `application/vnd.rdoc+html` registration path
- [ ] Version negotiation: readers ignore unknown manifest fields (document examples)
- [ ] Optional `rdoc-profile` field: `article` | `slides` | `contract` | `paper`
- [ ] Sidecar annotation format (highlights) — either embedded JSON or `.rdoc.ann.json`
- [ ] Multi-article collections / “book” profile (ordered spine of `.rdoc` parts)
- [ ] `canonicalUrl` optional field (for when a web twin exists)
- [ ] `license` / `rights` fields in manifest (SPDX)
- [ ] Changelog of format versions in `docs/CHANGELOG-FORMAT.md`

---

## Compiler & CLI

### Core pipeline

- [ ] Streaming build for very large notes (chunked image encode)
- [ ] `--assets-dir` explicit asset root
- [ ] `--fail-on-external` (default) / `--allow-data-images-only` documentation pass
- [ ] Front-matter (YAML) → manifest title/author/tags
- [ ] GFM task lists, footnotes polish, definition lists
- [ ] Syntax highlighting offline (Prism/Shiki → inline CSS, no CDN)
- [ ] Mermaid / Graphviz → **SVG at compile time** (no runtime JS diagram libs)
- [ ] Math: KaTeX/MathJax → SVG/MathML offline pipeline
- [ ] BibTeX / CSL citations → footnotes or end references
- [ ] HTML input mode (`rdoc build page.html`) with readability optional
- [ ] Diff mode: `rdoc diff a.rdoc b.rdoc` (manifest + hash + text)

### DX

- [ ] Watch mode: `rdoc build -w`
- [ ] Config file `rdoc.config.json` (author defaults, lang, theme default)
- [ ] Shell completions (bash/zsh/fish/powershell)
- [ ] Bun / Deno compatibility notes or first-class runners
- [ ] npm package publish `@rdoc/cli` (or `rdoc` name if available)
- [ ] Homebrew / Scoop / winget formulas
- [ ] Docker image `ghcr.io/.../rdoc` for CI converts

---

## Reader UX

- [ ] Optional **serif** reading theme (still system fonts)
- [ ] Focus / “zen” mode (hide chrome until hover)
- [ ] Keyboard map: `t` TOC, `+`/`-` font, `d` theme, `?` help
- [ ] Remember scroll position per `contentHash` in `localStorage`
- [ ] Text search overlay (`Ctrl/Cmd+F` enhancement for long docs)
- [ ] Reading ruler / line highlight (accessibility preference)
- [ ] Offline TTS hook (browser Speech Synthesis, no network)
- [ ] Better table UX on mobile (column priority / card stack option)
- [ ] Image lightbox (still no network; pure CSS/JS)
- [ ] Custom accent color via manifest `themeAccent` (CSS variable)
- [ ] “Copy plain text” / “Copy citation” buttons
- [ ] Print stylesheet presets: A4 / Letter / compact

---

## Security & trust

- [ ] **RFC 0002** — Ed25519 signatures over `contentHash` ([#4](https://github.com/DokaiiMob/rdoc/issues/4))
- [ ] Key discovery: `authorKeys` URL **optional** and never required for reading
- [ ] Detached signature files (`.rdoc.sig`) for immutable mirrors
- [ ] CSP report-only debug mode for authors (`rdoc build --csp-report`)
- [ ] Hardening guide: opening untrusted `.rdoc` (file:// vs hosted)
- [ ] Subresource integrity notes if ever hosting reader chrome separately (discouraged)
- [ ] Fuzz tests for sanitizeArticleHtml
- [ ] Threat model doc: XSS, tracking pixels, exfiltration via CSS, SVG scripts

---

## Ecosystem & integrations

### Editors & IDEs

- [ ] VS Code / Cursor extension: “Export to .rdoc”
- [ ] Neovim / Helix command hooks
- [ ] Typora / MarkText export plugin research

### Browsers

- [ ] Extension: **Save page as .rdoc** (Readability → compile) ([#3](https://github.com/DokaiiMob/rdoc/issues/3))
- [ ] Extension: open `.rdoc` links with correct MIME handling
- [ ] “Share target” PWA receive share → convert

### Static sites & blogs

- [ ] Eleventy / Astro / Hugo / Next MDX pipeline examples
- [ ] Ghost / Substack “attach offline edition” workflow guide
- [ ] Habr / Medium bookmarklet to pack article

### Automation

- [ ] GitHub Action `rdoc-build` for docs-as-code repos
- [ ] pre-commit hook to rebuild docs on MD change
- [ ] Cloudflare Worker / Netlify function for convert-on-upload (optional; reading stays offline)

### Interop

- [ ] Import from EPUB (subset) → `.rdoc`
- [ ] Import from PDF via text layer + heuristics (best-effort; never claim perfect layout)
- [ ] Export to plain Markdown round-trip (lossy OK)
- [ ] Comparison matrix vs MHTML, SingleFile, EPUB, WebArchive

---

## Authoring & PKM

- [ ] Obsidian: Community Plugin store listing + settings polish
- [ ] Obsidian: export folder / Dataview selection / MOC → multi-doc pack
- [ ] Logseq / Foam / Athens / Reflect bridges
- [ ] Notion export HTML → `.rdoc` cleaner
- [ ] Roam-style block refs → footnotes or anchors
- [ ] Wikilink resolution profiles (`obsidian`, `github-wiki`, `plain`)
- [ ] Template gallery: newsletter, lab notebook, RFC-style, trip report
- [ ] “Style guide” for long-form `.rdoc` (measure, headings, callouts)

---

## Distribution & discovery

- [ ] Directory site: public gallery of example `.rdoc` docs (opt-in)
- [ ] “Made with rdoc” badge SVG for authors
- [ ] npm `create-rdoc` scaffolder
- [ ] Standard filename conventions (`YYYY-title.rdoc.html`)
- [ ] Content-addressed mirrors by `contentHash` (IPFS / BitTorrent notes — optional)
- [ ] Messenger-friendly tips (Telegram / WhatsApp / iMessage compression)
- [ ] Email attachment best practices (size budgets, `.rdoc.html` extension)

---

## Accessibility & i18n

- [ ] axe-core CI on generated demo
- [ ] Screen reader pass over TOC / footnotes / progress
- [ ] `prefers-reduced-motion` for progress / UI
- [ ] High-contrast theme preset
- [ ] RTL (`dir=rtl`) verification for Arabic/Hebrew samples
- [ ] CLI + reader UI strings externalized (en first, then community locales)
- [ ] Locale-aware reading-time estimate
- [ ] Dyslexia-friendly optional system font stack note

---

## Performance & packaging

- [ ] Image pipeline: optional recompress / max-width at compile
- [ ] AVIF/WebP preference with PNG fallback inlining rules
- [ ] Bundle size budgets in CI (runtime JS ≤ 10KB; CSS tracked)
- [ ] Lazy-decode very large base64 images (progressive enhancement)
- [ ] Brotli/gzip size report in `inspect`
- [ ] Tree-shake unused reader features via build profiles (`minimal`, `full`)

---

## Academic & long-form

- [ ] Pandoc → `.rdoc` for LaTeX papers
- [ ] IEEE/ACM-ish citation styles as footnotes
- [ ] Numbered theorems / figures / cross-links
- [ ] Multi-file “thesis” pack with shared TOC
- [ ] ArXiv companion workflow (“HTML abstract + .rdoc fulltext”)
- [ ] Jupyter → `.rdoc` (execute optional; static output default)
- [ ] Quarto / R Markdown output format

---

## Legal / business documents

- [ ] Contract profile: fixed hash + signature (RFC 0002) + freeze typography option
- [ ] Redline / diff viewer between two signed versions
- [ ] Watermark layer for review drafts (CSS-only)
- [ ] Clause deep-linking (`#clause-12`) conventions
- [ ] “Mobile-first MSA” template pack
- [ ] Retention: recommend keeping both `.rdoc` and print PDF for archives

---

## Community & governance

- [ ] PUBLIC roadmap voting via GitHub Discussions
- [ ] Quarterly RFC review call notes
- [ ] Brand assets (logo SVG, OG image, social card)
- [ ] Official Discord / Matrix (if demand appears)
- [ ] Mentorship tags: `good first issue`, `help wanted`, `RFC`
- [ ] Ambassadors: newsletter authors, PKM YouTubers, uni lab notes
- [ ] Translation teams for RFC & docs

---

## Research / speculative

> Ideas that may never ship — captured so they don’t get lost.

- [ ] CRDT annotations syncing across devices **without** a required vendor server
- [ ] Partial encryption of sections (age/age-plugin) while keeping public abstract
- [ ] “Living document” with signed update chain (hash-linked manifests)
- [ ] Native OS handlers beyond browser (minimal WebView shells)
- [ ] Hardware e-ink optimized CSS profile
- [ ] `.rdoc` as a teaching format for digital literacy (HTML you can hold)
- [ ] Formal verification of canonicalize(hash) properties
- [ ] Integration with ATProto / Nostr as distribution, not dependency for reading

---

## Non-goals (for now)

- Replacing PDF in print-centric court / archival pipelines that mandate fixed pagination
- DRM, sealed proprietary readers, or license-enforcement runtimes
- Requiring a server or account to **read** a document
- Pixel-perfect Word/InDesign layout cloning
- Heavy SPA frameworks inside the document runtime
- Tracking, analytics, or remote font loading in the default template

---

## How we prioritize

| Score higher if… | Score lower if… |
| --- | --- |
| Helps someone open a file on a phone **today** | Needs new OS APIs or browser vendors |
| Shrinks chicken-and-egg (authors ↔ readers) | Only helps niche desktop workflows |
| Keeps files small, offline, auditable | Adds network or account requirements |
| Clear RFC / test impact | Pure cosmetics without a11y gain |

When in doubt: **ship an example document**, not a new dependency.

---

## Suggest an idea

Open a [feature request](https://github.com/DokaiiMob/rdoc/issues/new/choose) or start a Discussion.  
If it’s actionable in a weekend, mark it `good first issue` and link back here.
