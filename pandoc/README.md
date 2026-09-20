# Pandoc → RDOC

Convert Markdown, LaTeX, and other [Pandoc](https://pandoc.org/)-supported formats into `.rdoc` / `.rdoc.html`.

## Design (two-step)

Full RDOC is **not** produced by Pandoc alone. Pandoc cannot emit CSP, the `application/rdoc+json` manifest, `contentHash`, or reader chrome. Those come from the reference compiler.

| Step | Tool | Result |
| --- | --- | --- |
| **a** | `pandoc` (+ optional `rdoc.lua`) | Intermediate **GFM Markdown** (or HTML preview) |
| **b** | `rdoc build` / `node dist/cli.js build` | Final self-contained polyglot |

```text
  input.md / input.tex / …
        │
        ▼
  pandoc -t gfm -L pandoc/rdoc.lua
        │
        ▼
  intermediate.md          ← step a
        │
        ▼
  node dist/cli.js build
        │
        ▼
  out.rdoc.html            ← step b (CSP, manifest, hash, chrome)
```

**Prerequisites:** Pandoc on `PATH`, Node ≥ 18, and a built CLI (`npm run build` → `dist/cli.js`).

---

## Quick path (wrappers)

Wrappers run both steps and clean up the temp Markdown.

### PowerShell (Windows)

```powershell
# From repo root
npm run build

.\pandoc\pandoc-rdoc.ps1 sample.md -o sample.rdoc.html
.\pandoc\pandoc-rdoc.ps1 paper.tex -o paper.rdoc.html -Title "My Paper" -Author "Ada"
.\pandoc\pandoc-rdoc.ps1 paper.tex -o paper.rdoc.html -PandocArgs @('-f','latex')
```

### Bash (Linux / macOS / Git Bash)

```bash
npm run build
chmod +x pandoc/pandoc-rdoc.sh

./pandoc/pandoc-rdoc.sh sample.md -o sample.rdoc.html
./pandoc/pandoc-rdoc.sh paper.tex -o paper.rdoc.html --title "My Paper" --author "Ada"
./pandoc/pandoc-rdoc.sh paper.tex -o paper.rdoc.html -- -f latex
```

---

## Manual commands

### Markdown → RDOC (recommended)

Pandoc is optional for plain `.md` (you can call `rdoc build` directly). Use Pandoc when you need format conversion or GFM normalization:

```bash
pandoc article.md -t gfm -L pandoc/rdoc.lua -o intermediate.md
node dist/cli.js build intermediate.md -o article.rdoc.html \
  --title "Article" --author "Anonymous" --lang en
```

Windows (PowerShell):

```powershell
pandoc article.md -t gfm -L pandoc/rdoc.lua -o intermediate.md
node dist/cli.js build intermediate.md -o article.rdoc.html `
  --title "Article" --author "Anonymous" --lang en
```

### LaTeX → RDOC

```bash
pandoc paper.tex -f latex -t gfm -L pandoc/rdoc.lua -o intermediate.md
node dist/cli.js build intermediate.md -o paper.rdoc.html --lang en
```

Or with the custom writer (same Markdown intermediate):

```bash
pandoc paper.tex -t pandoc/rdoc-writer.lua -o intermediate.md
node dist/cli.js build intermediate.md -o paper.rdoc.html
```

### HTML preview only (incomplete)

Produces HTML with `<article id="rdoc-content">` and an HTML comment warning. **No** CSP, manifest, hash, or reader UI:

```bash
pandoc input.md -t html5 -L pandoc/rdoc.lua -o preview.rdoc.html
```

Treat this as a structural preview. For a real `.rdoc`, always finish with step **b**.

---

## Files

| File | Role |
| --- | --- |
| `rdoc.lua` | Lua filter: title meta, strip raw `<script>`/`<iframe>`, wrap HTML in `<article id="rdoc-content">` |
| `rdoc-writer.lua` | Custom writer → GFM Markdown for `rdoc build` |
| `pandoc-rdoc.sh` | Bash: pandoc → temp `.md` → `node dist/cli.js build` |
| `pandoc-rdoc.ps1` | PowerShell: same two-step pipeline |

No new npm dependencies. Nothing under `src/` or `package.json` is required for this path.

---

## Limitations

- **`rdoc build` accepts Markdown only.** Pandoc must emit Markdown (preferably GFM) for the final polyglot. Intermediate HTML from `-t html5` is not fed into `rdoc build`.
- **External images / scripts** in the source are rejected by the compiler. Use local image paths; they are inlined as `data:` URIs at build time.
- **RDOC callouts / footnote UX** (`processCallouts`, `.rdoc-fn-ref`) are implemented in the TypeScript compiler, not in this Pandoc filter. Prefer authoring those in Markdown that `rdoc` already understands, or accept plain Pandoc footnotes.
- **Complex LaTeX** (custom macros, TikZ, bibliography styles) may need Pandoc flags (`--citeproc`, `-f latex+…`) or pre-processing; the wrapper only forwards extra args.
- **Math:** Pandoc may emit TeX or MathML depending on flags; the RDOC reader does not ship a math renderer. Prefer plain text or pre-rendered SVG/images for offline math.
- **Filter ≠ full format.** Opening pandoc-only HTML in a browser is fine for layout checks; integrity (`contentHash`) and offline packaging still require `rdoc build`.

---

## Exact recommended command

From the repository root, after `npm run build`:

```bash
pandoc INPUT -t gfm -L pandoc/rdoc.lua -o intermediate.md && \
  node dist/cli.js build intermediate.md -o OUTPUT.rdoc.html
```

Or one shot:

```bash
./pandoc/pandoc-rdoc.sh INPUT -o OUTPUT.rdoc.html
# Windows:
.\pandoc\pandoc-rdoc.ps1 INPUT -o OUTPUT.rdoc.html
```
]]
