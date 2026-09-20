<div align="center">

![rdoc](https://capsule-render.vercel.app/api?type=waving&color=0:0B6E4F,100:1A3D32&height=200&section=header&text=rdoc&fontSize=54&fontColor=F7FFF9&fontAlignY=35&desc=Responsive%20offline%20documents&descAlignY=55&descSize=18)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Segoe+UI&weight=600&size=22&duration=3500&pause=900&color=0B6E4F&center=true&vCenter=true&width=640&lines=Tired+of+zooming+PDFs+on+your+phone%3F;One+UTF-8+file.+Any+browser.+Zero+CDN.;Markdown+%E2%86%92+.rdoc.html+in+seconds;Offline-first.+Mobile-first.+Open+format.)](https://dokaiimob.github.io/rdoc/)

**Self-contained · Adaptive · Offline · Browser-native**

[![Version](https://img.shields.io/badge/version-0.1.0-0B6E4F?style=for-the-badge)](https://github.com/DokaiiMob/rdoc/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-1A3D32?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![RFC 0001](https://img.shields.io/badge/spec-RFC%200001-0B6E4F?style=for-the-badge)](docs/rfc-0001-rdoc.md)
[![Demo](https://img.shields.io/badge/live-playground-E8A838?style=for-the-badge)](https://dokaiimob.github.io/rdoc/)
[![Stars](https://img.shields.io/github/stars/DokaiiMob/rdoc?style=for-the-badge&color=0B6E4F)](https://github.com/DokaiiMob/rdoc/stargazers)

[Live Demo](https://dokaiimob.github.io/rdoc/) · [Open Sample](https://dokaiimob.github.io/rdoc/demo.rdoc.html) · [RFC](docs/rfc-0001-rdoc.md) · [Roadmap](ROADMAP.md) · [Issues](https://github.com/DokaiiMob/rdoc/issues)

[Русский](README.ru.md) · Docs language: **English is canonical** — see [README policy](docs/README-POLICY.md).

<br/>

[![Skills](https://skillicons.dev/icons?i=ts,nodejs,html,css,js,markdown,github,vscode)](https://skillicons.dev)

</div>

---

## Why `.rdoc`?

PDFs were designed for **A4 paper**. On a phone you pinch, pan, and lose the plot.  
Web pages reflow — until the CDN dies, the font kit 404s, or the tracker farm wakes up.

**`.rdoc`** is a self-contained UTF-8 **HTML polyglot**:

| | PDF | Web page | **`.rdoc`** |
| --- | :---: | :---: | :---: |
| Works offline as one file | ✅ | ❌ often | **✅** |
| Reflows on mobile | ❌ | ✅ | **✅** |
| No CDN / webfonts / trackers | ✅ | ❌ often | **✅** |
| Opens in any browser | ❌ needs reader | ✅ | **✅** |
| Content integrity (SHA-256) | optional | ❌ | **✅** |

> Ship `.rdoc.html` today — zero friction. Associate bare `.rdoc` when you're ready.

---

## Table of contents

- [Live playground](#-live-playground)
- [Quick start](#-quick-start)
- [CLI](#-cli)
- [Reader features](#-reader-features)
- [Integrity & security](#-integrity--security)
- [Obsidian plugin](#-obsidian-plugin)
- [OS association](#-os-file-association)
- [Project layout](#-project-layout)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Live playground

<div align="center">

**No install. Drop Markdown → download `.rdoc.html`.**

[![Open playground](https://img.shields.io/badge/▶_Open_Playground-0B6E4F?style=for-the-badge)](https://dokaiimob.github.io/rdoc/)
[![Open demo doc](https://img.shields.io/badge/📱_Phone_demo-1A3D32?style=for-the-badge)](https://dokaiimob.github.io/rdoc/demo.rdoc.html)

Scan the QR on the [landing page](https://dokaiimob.github.io/rdoc/) to open the sample on your phone — TOC, dark mode, footnote popovers included.

</div>

---

## ⚡ Quick start

```bash
git clone https://github.com/DokaiiMob/rdoc.git
cd rdoc
npm install
npm run build

node dist/cli.js init demo
node dist/cli.js build sample.md -o my_article.rdoc.html
node dist/cli.js inspect my_article.rdoc.html
node dist/cli.js serve my_article.rdoc.html
```

Open `my_article.rdoc.html` in a browser — or AirDrop / Telegram it to your phone.

<details>
<summary><b>Full install options &amp; global binary</b></summary>

### Requirements

- [Node.js](https://nodejs.org/) **18+**
- npm (bundled with Node)

### Build everything

```bash
npm run build          # CLI → dist/
npm run build:site     # GitHub Pages playground → docs/
npm run build:obsidian # Obsidian plugin → plugins/obsidian-rdoc/main.js
```

### Optional global command

```bash
npm link
rdoc --help
```

</details>

---

## 🛠️ CLI

| Command | What it does |
| --- | --- |
| `rdoc build <in.md> -o <out>` | Markdown → `.rdoc` / `.rdoc.html`, inline local images as `data:` |
| `rdoc inspect <file>` | Manifest, size, SHA-256, reading time |
| `rdoc serve <file> [-p port]` | Local HTTP preview |
| `rdoc open <file>` | Open in browser (bare `.rdoc` → temp `.html`) |
| `rdoc associate [--undo]` | Register / remove OS file association |
| `rdoc init demo` | Write a rich `sample.md` fixture |

<details>
<summary><b>Build flags</b></summary>

```bash
node dist/cli.js build article.md -o article.rdoc.html \
  --title "Title" \
  --author "Name" \
  --lang en \
  --description "Short summary"
```

</details>

---

## 📖 Reader features

- Comfortable measure (~**65–75** characters)
- System font stack only (SF / Segoe UI / Roboto / Inter — **no Google Fonts**)
- Light / dark / system theme
- Collapsible **TOC** (bottom sheet on mobile, sidebar on desktop)
- Reading **progress** bar
- Font size **A− / A+**
- Footnote **popovers** (no jump-to-footer)
- **Print → PDF** via `window.print()` with chrome stripped

---

## 🔒 Integrity & security

Aligned with [RFC 0001](docs/rfc-0001-rdoc.md):

- `contentHash` = SHA-256 after **Unicode NFC** + newline canonicalization to **LF**
- Hard **CSP** embedded in every file (`default-src 'none'`, no network exfiltration)
- Compiler strips `<script>` / `<iframe>` / inline event handlers from article HTML
- `@media print` hides all `.rdoc-chrome` UI

<details>
<summary><b>File anatomy (one glance)</b></summary>

1. Valid HTML5, UTF-8  
2. Manifest in `<script type="application/rdoc+json">`  
3. Body in `<article id="rdoc-content">`  
4. CSS + JS inlined — **zero** external URLs  
5. Media type: `application/vnd.rdoc+html` (interop: `.rdoc.html`)

</details>

<details>
<summary><b>Markdown extensions</b></summary>

**Footnotes**

```markdown
See note.[^1]

[^1]: Opens as a popover on tap.
```

**Callouts**

````markdown
::: tip
Works offline in the subway.
:::
````

Kinds: `tip`, `info`, `warning` (or any custom label).

**Images** — local paths only; compiled to `data:` URIs. Remote `http(s)` images are rejected.

</details>

---

## 🔌 Obsidian plugin

Export the current note as a standalone mobile-ready document.

```bash
npm run build:obsidian
# copy main.js + manifest.json → {Vault}/.obsidian/plugins/rdoc-export/
```

Command Palette → **Export current note to .rdoc**

Details: [`plugins/obsidian-rdoc/`](plugins/obsidian-rdoc/)

---

## 💻 OS file association

```bash
node dist/cli.js associate
node dist/cli.js open my_article.rdoc
```

| Platform | Mechanism |
| --- | --- |
| Windows | `HKCU` ProgID → `rdoc open` |
| Linux | MIME `application/vnd.rdoc+html` + `.desktop` |
| macOS | `~/.local/bin/rdoc-open` wrapper |

Manual helpers: [`assoc/`](assoc/)

> Messengers & AirDrop: prefer **`.rdoc.html`** so recipients need nothing installed.

---

## 📁 Project layout

```
rdoc/
├── docs/                 # GitHub Pages + RFC 0001
├── site/                 # playground sources
├── assoc/                # OS registration scripts
├── plugins/obsidian-rdoc/
├── src/
│   ├── cli.ts
│   ├── compiler.ts
│   ├── normalize.ts      # NFC + LF + CSP + sanitize
│   ├── md-ext.ts
│   ├── associate.ts
│   ├── validator.ts
│   └── template/         # reader CSS + <10KB JS runtime
└── ROADMAP.md
```

---

## 📊 Repo pulse

<div align="center">

[![Repo card](https://github-readme-stats.vercel.app/api/pin/?username=DokaiiMob&repo=rdoc&theme=vue&hide_border=true&bg_color=0D1117&title_color=0B6E4F&icon_color=0B6E4F&text_color=C9D1D9)](https://github.com/DokaiiMob/rdoc)

[![GitHub stars](https://img.shields.io/github/stars/DokaiiMob/rdoc?style=for-the-badge&logo=github&color=0B6E4F)](https://github.com/DokaiiMob/rdoc/stargazers)
[![Forks](https://img.shields.io/github/forks/DokaiiMob/rdoc?style=for-the-badge&logo=github&color=1A3D32)](https://github.com/DokaiiMob/rdoc/network/members)
[![Issues](https://img.shields.io/github/issues/DokaiiMob/rdoc?style=for-the-badge&color=E8A838)](https://github.com/DokaiiMob/rdoc/issues)
[![Last commit](https://img.shields.io/github/last-commit/DokaiiMob/rdoc?style=for-the-badge&color=0B6E4F)](https://github.com/DokaiiMob/rdoc/commits/main)

</div>

---

## 🤝 Contributing

We love PRs that shrink the chicken-and-egg problem for open document formats.

- Read [ROADMAP.md](ROADMAP.md) and pick a **good first issue**
- Keep the format **offline-first** and **browser-openable**
- Match [RFC 0001](docs/rfc-0001-rdoc.md) for hashing, CSP, and structure

```bash
npm run build && node dist/cli.js inspect path/to/file.rdoc.html
```

---

## 📜 License

[MIT](LICENSE) — use it, fork it, ship documents with it.

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:1A3D32,100:0B6E4F&height=120&section=footer)

**Stop zooming. Start reading.**

[★ Star on GitHub](https://github.com/DokaiiMob/rdoc) · [Try the playground](https://dokaiimob.github.io/rdoc/)

</div>
