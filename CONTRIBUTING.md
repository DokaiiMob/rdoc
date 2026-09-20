# Contributing to rdoc

Thanks for helping grow **`.rdoc`** — an offline-first, browser-native document format under [DokaiiMob/rdoc](https://github.com/DokaiiMob/rdoc).

Please read the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Before you start

- Skim [RFC 0001](docs/rfc-0001-rdoc.md) (format rules: hashing, CSP, structure).
- Check [ROADMAP.md](ROADMAP.md) and [good first issues](https://github.com/DokaiiMob/rdoc/labels/good%20first%20issue).
- Prefer changes that stay **offline**, **self-contained**, and **browser-openable** without a proprietary app.

## Development setup

Requirements: **Node.js ≥ 18**.

```bash
npm install
npm run build
```

The CLI binary is `dist/cli.js` (also exposed as `npx rdoc` / `npm run rdoc`).

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile TypeScript + copy `src/template` → `dist/template` |
| `npm run rdoc -- build sample.md -o out.rdoc.html` | Build a document |
| `npm run rdoc -- inspect out.rdoc.html` | Manifest, hash, size |
| `npm run rdoc -- validate out.rdoc.html` | Strict CI checks |
| `npm run test:conformance` | Conformance suite (`tests/conformance`) |
| `npm run build:obsidian` | Sync reader assets + build Obsidian plugin |

Watch mode:

```bash
npm run rdoc -- build sample.md -o out.rdoc.html -w
```

## Project layout (where to change things)

| Area | Path |
| --- | --- |
| CLI / compiler | `src/cli.ts`, `src/compiler.ts` |
| Hash / CSP / sanitize | `src/normalize.ts`, `src/validator.ts` |
| Reader CSS + runtime | `src/template/reader.css`, `src/template/runtime.js` |
| Types / manifest | `src/types.ts`, `schemas/rdoc-manifest-1.0.json` |
| Format docs | `docs/rfc-0001-rdoc.md`, `docs/CHANGELOG-FORMAT.md` |

After editing templates, run `npm run build` so `dist/` (and optionally `npm run build:obsidian`) pick up the assets.

## Pull request tips

1. **Keep PRs focused** — one concern per PR when practical.
2. **Preserve integrity rules** — `contentHash` uses Unicode **NFC** + newlines → **LF**; do not hash chrome or unknown optional manifest fields into content.
3. **No network in documents** — no CDN, Google Fonts, remote scripts, or phone-home in the default template.
4. **Keep the runtime small** — progressive enhancement only; prefer CSS; degrade gracefully when APIs are missing.
5. **Test locally** before opening a PR:

   ```bash
   npm run build
   npm run test:conformance
   npm run rdoc -- validate path/to/your.rdoc.html
   ```

6. Link related issues and note any format/RFC impact (update `docs/CHANGELOG-FORMAT.md` / RFC if you add manifest fields).
7. Match existing code style; avoid drive-by refactors unrelated to the change.

## Reporting issues

Use [GitHub Issues](https://github.com/DokaiiMob/rdoc/issues). Include OS, Node version, and a minimal Markdown fixture when reporting compiler or hash bugs.

## License

Contributions are accepted under the project [MIT](LICENSE) license.
