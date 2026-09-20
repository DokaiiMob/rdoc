# Roadmap

Priorities for growing `.rdoc` after the MVP. Contributions welcome — see [good first issues](https://github.com/DokaiiMob/rdoc/labels/good%20first%20issue).

## Now (post-audit hardening)

- [x] Canonical `contentHash` (Unicode NFC + LF newlines)
- [x] Restrictive CSP meta on every document
- [x] Print stylesheet hides all `.rdoc-chrome`
- [x] Browser playground + GitHub Pages landing (`/site`)
- [ ] Publish Obsidian plugin to Community Plugins catalog
- [ ] Show HN + r/ObsidianMD + Habr/dev.to launch posts

## Next

### Pandoc writer (`good first issue`)

`pandoc paper.tex -t rdoc -o paper.rdoc.html` — academic path into the format.

### Browser extension: Save as .rdoc

Readability cleanup → self-contained `.rdoc.html` (SingleFile alternative with manifest + hash).

### RFC 0002 — signatures

Optional Ed25519 `signature` + author key id in the manifest for contracts and specs.

### Richer compile

- Wikilink → plain text / relative anchors profile for Obsidian fidelity
- Math: prefer inline SVG; optional KaTeX-to-SVG offline pipeline
- Deterministic timestamps option for reproducible builds

### Ecosystem

- VS Code / Cursor “Export to .rdoc” command
- Logseq / Foam export bridges
- MIME registration notes for Linux distros

## Non-goals (for now)

- Replacing PDF in print-centric legal archives
- DRM / sealed viewer apps
- Server-side required components for reading
