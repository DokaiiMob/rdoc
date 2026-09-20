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
7. [Native readers (desktop + Android)](#native-readers-desktop--android)
8. [Security & trust](#security--trust)
9. [Ecosystem & integrations](#ecosystem--integrations)
10. [Authoring & PKM](#authoring--pkm)
11. [Distribution & discovery](#distribution--discovery)
12. [Accessibility & i18n](#accessibility--i18n)
13. [Performance & packaging](#performance--packaging)
14. [Academic & long-form](#academic--long-form)
15. [Legal / business documents](#legal--business-documents)
16. [Community & governance](#community--governance)
17. [Research / speculative](#research--speculative)
18. [Non-goals (for now)](#non-goals-for-now)
19. [How we prioritize](#how-we-prioritize)

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

- [x] TypeScript CLI: `build`, `inspect`, `validate`, `serve`, `open`, `associate`, `init demo|config`
- [x] Markdown → self-contained HTML polyglot (`marked` + extensions)
- [x] Local image inlining (`data:`), reject remote images
- [x] Manifest `application/rdoc+json` + SHA-256 `contentHash`
- [x] Canonical hashing: Unicode **NFC** + newlines → **LF**
- [x] Restrictive **CSP** meta on every document
- [x] Article HTML sanitize (`script` / `iframe` / inline handlers)
- [x] Adaptive reader CSS + compact vanilla runtime (TOC, theme, serif, zen, find, TTS, lightbox, print presets, …)
- [x] Print isolation (`.rdoc-chrome` hidden in `@media print`)
- [x] OS association helpers (Windows / Linux / macOS)
- [x] Obsidian export plugin (vault images → base64)
- [x] RFC 0001 **Accepted** (format **1.1.0**)
- [x] GitHub Pages playground (drag-and-drop MD converter + demo + QR)
- [x] MIT license, public GitHub repo
- [x] `rdoc build -w` watch mode + `rdoc.config.json`
- [x] Manifest optional fields: `profile`, `canonicalUrl`, `license`, `rights`
- [x] JSON Schema `schemas/rdoc-manifest-1.0.json`
- [x] Conformance suite + GitHub Actions CI
- [x] Pandoc two-step path (`pandoc/`)
- [x] Shell completions (bash/zsh/fish/powershell)
- [x] Docker + Homebrew/Scoop/Winget stubs + publishing notes
- [x] English canonical README + `README.ru.md` policy
- [x] **Native readers (v0.2.0)** — open bare `.rdoc` without renaming:
  - Desktop Electron shell ([`apps/desktop-reader/`](apps/desktop-reader/)) — HTML semantics via custom protocol
  - Android Kotlin WebView ([`apps/android-reader/`](apps/android-reader/)) — UTF-8 load + open/share intents
  - Shared branding kit ([`apps/shared/branding/`](apps/shared/branding/))
  - [GitHub Release v0.2.0](https://github.com/DokaiiMob/rdoc/releases/tag/v0.2.0) (Windows portable + debug APK)
- [x] **Native readers polish (v0.3.0)** — Open With UX, recent files, integrity badge, theme chrome, DnD queue, empty-state, optional update check, NSIS + file associations + `rdoc://` protocol; Android intent-filters + local recent; Authenticode still deferred

---

## Near-term (0–3 months)

### Launch & awareness

- [ ] Show HN post + polished landing metrics (demo CTR)
- [ ] Posts: r/ObsidianMD, r/markdown, r/selfhosted, Lobsters
- [ ] Long-form article (dev.to / Hashnode): architecture of the polyglot + CSP + hash
- [ ] Short “PDF vs .rdoc” phone video / GIF for social
- [x] Add `CONTRIBUTING.md` + Code of Conduct

### Product gaps

- [ ] Publish Obsidian plugin to **Community Plugins** catalog
- [x] Deterministic `--created` / `SOURCE_DATE_EPOCH` for reproducible builds ([#2](https://github.com/DokaiiMob/rdoc/issues/2))
- [x] Pandoc writer / Lua filter ([#1](https://github.com/DokaiiMob/rdoc/issues/1))
- [x] CI: build + `inspect`/`validate` smoke test on sample fixture
- [x] `rdoc validate` alias (strict exit codes for CI)
- [x] English + Russian README sync policy (English canonical)

### Playground

- [ ] Side-by-side real PDF iframe vs generated `.rdoc` (optional user upload)
- [ ] “Share link” via compressed fragment / File System Access API save
- [ ] PWA install of the playground (still offline-capable for convert)

---

## Format & specification

- [x] **RFC 0001** → `Accepted` after community review window
- [x] Formal JSON Schema for the manifest (`schemas/rdoc-manifest-1.0.json`)
- [x] Conformance test suite (fixtures: pass/fail hash, CSP present, single article)
- [x] Media type IANA notes / `application/vnd.rdoc+html` registration path
- [x] Version negotiation: readers ignore unknown manifest fields (document examples)
- [x] Optional `rdoc-profile` field: `article` | `slides` | `contract` | `paper`
- [x] Sidecar annotation format (highlights) — either embedded JSON or `.rdoc.ann.json`
- [x] Multi-article collections / “book” profile (ordered spine of `.rdoc` parts)
- [x] `canonicalUrl` optional field (for when a web twin exists)
- [x] `license` / `rights` fields in manifest (SPDX)
- [x] Changelog of format versions in `docs/CHANGELOG-FORMAT.md`

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

- [x] Watch mode: `rdoc build -w`
- [x] Config file `rdoc.config.json` (author defaults, lang, theme default)
- [x] Shell completions (bash/zsh/fish/powershell)
- [x] Bun / Deno compatibility notes or first-class runners
- [x] npm package publish `@rdoc/cli` (or `rdoc` name if available) — docs in `docs/PUBLISHING.md`
- [x] Homebrew / Scoop / winget formulas (stubs under `packaging/`)
- [x] Docker image `ghcr.io/.../rdoc` for CI converts (`Dockerfile` + publish notes)

---

## Reader UX

- [x] Optional **serif** reading theme (still system fonts)
- [x] Focus / “zen” mode (hide chrome until hover)
- [x] Keyboard map: `t` TOC, `+`/`-` font, `d` theme, `?` help
- [x] Remember scroll position per `contentHash` in `localStorage`
- [x] Text search overlay (`Ctrl/Cmd+F` enhancement for long docs)
- [x] Reading ruler / line highlight (accessibility preference)
- [x] Offline TTS hook (browser Speech Synthesis, no network)
- [x] Better table UX on mobile (column priority / card stack option)
- [x] Image lightbox (still no network; pure CSS/JS)
- [x] Custom accent color via manifest `themeAccent` (CSS variable)
- [x] “Copy plain text” / “Copy citation” buttons
- [x] Print stylesheet presets: A4 / Letter / compact

---

## Native readers (desktop + Android)

Browser remains the canonical reader. Native shells exist so **bare `.rdoc`** opens with HTML semantics without renaming to `.rdoc.html`.

**Shipped (v0.2.0):** Electron desktop reader, Android WebView reader, shared branding — see [Shipped](#shipped-mvp--public-hardening) and [release notes](https://github.com/DokaiiMob/rdoc/releases/tag/v0.2.0).

### Near-term improvements

- [x] Open With / “always open `.rdoc` with rdoc Reader” UX polish (Windows + Android)
- [x] Recent files list (local only; no cloud)
- [x] Sync title / TOC chrome with document theme (light/dark)
- [x] Validate / `contentHash` status badge in shell chrome
- [x] Dark titlebar / system accent on Windows
- [x] Drag-and-drop polish (multi-file queue, folder reject with clear message)
- [x] Empty-state: drop zone + sample link + “what is `.rdoc`?” one-liner

### Desktop-specific (`apps/desktop-reader/`)

- [x] Auto-update channel (GitHub Releases; optional, off by default)
- [x] NSIS / MSI installers with **file association** for `.rdoc` / `.rdoc.html` (MSI when WiX available)
- [ ] macOS (`.dmg` / `.app`) and Linux (AppImage / `.deb`) builds
- [ ] Code-signed Windows builds (Authenticode) — deferred; signing hook stubbed, unsigned releases documented
- [x] Protocol / deep-link handler polish (`rdoc://` open path)
- [x] Portable vs installed edition docs (PATH, default app, uninstaller)

### Android-specific (`apps/android-reader/`)

- [ ] Release / signed APK + **AAB** for Play Store — deferred from v0.2.0
- [ ] Play Store listing (screenshots, privacy policy, content rating)
- [ ] Storage Access Framework (SAF) for durable open from Downloads / Drive
- [x] Share-target / `ACTION_SEND` polish for `.rdoc` attachments (MIME + pathPattern Open With; Recent via SharedPreferences)
- [ ] Material You dynamic color + edge-to-edge chrome
- [ ] Predictive back / gesture navigation with WebView history
- [ ] Optional home-screen widget (open last doc / pin a file) — nice-to-have

### Cross-platform

- [ ] Keep [`apps/shared/branding/`](apps/shared/branding/) as the single icon/logo source of truth
- [ ] iOS / iPadOS reader (WKWebView) — later; not blocking desktop/Android polish
- [ ] Research Flutter or Tauri migration (shared UI vs Electron/Kotlin size tradeoffs)
- [ ] Sync annotations with sidecar `.rdoc.ann.json` (local files; optional later sync)
- [ ] Print / export PDF from the native shell (delegate to document print CSS)

### Distribution

- [x] winget / Scoop / Homebrew casks for the **reader** (stubs under [`packaging/`](packaging/); CLI packaging already stubbed)
- [x] F-Droid recipe sketch (reproducible debug→release path) — [`packaging/fdroid/`](packaging/fdroid/); upstream MR still TODO
- [x] GitHub Releases automation: tagged builds for Windows portable, macOS, Linux, Android APK/AAB — [`.github/workflows/release-readers.yml`](.github/workflows/release-readers.yml)
- [x] Checksums + SBOM notes on each reader asset — workflow `SHA256SUMS` + [`docs/SBOM-READERS.md`](docs/SBOM-READERS.md)

---

## Security & trust

- [x] **RFC 0002** Draft — Ed25519 signatures over `contentHash` + CLI `keygen` / `sign` / `verify` ([#4](https://github.com/DokaiiMob/rdoc/issues/4)) — community review → Accepted still open
- [x] Key discovery: optional `authorKeys` URL + `rdoc verify --fetch-keys` (never required for reading)
- [x] Detached signature files (`.rdoc.sig`) via `rdoc sign --detached`
- [x] CSP report-only debug mode for authors (`rdoc build --csp-report`)
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

- [x] Extension MVP: **Save page as .rdoc** (extract → polyglot download) ([#3](https://github.com/DokaiiMob/rdoc/issues/3)) — see `extensions/save-as-rdoc/`
- [ ] Extension: Chrome Web Store / AMO publish + full reader chrome parity
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
- [x] Native OS handlers beyond browser (minimal WebView shells) — MVP shipped in v0.2.0; backlog under [Native readers](#native-readers-desktop--android)
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
