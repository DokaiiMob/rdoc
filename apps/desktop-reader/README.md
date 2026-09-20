# rdoc Desktop Reader

Minimal **Electron** app that opens bare `.rdoc` (and `.rdoc.html`) files as HTML — without renaming the extension.

The file is served over a custom `rdoc://` protocol with `Content-Type: text/html`, so Chromium applies HTML semantics despite the `.rdoc` extension.

**Version:** 0.3.0

## Requirements

- Node.js 18+
- Windows x64 (primary target; other platforms can run via `npm start`)

## Run from source

```powershell
cd apps/desktop-reader
npm install
npm start
```

Open a document:

- Welcome screen → **Open…** / drop zone (`Ctrl+O`)
- Drag & drop one or more `.rdoc` files (first opens; extras go to Recent / queue)
- **Open sample** (ships `sample.rdoc`)
- CLI: `npm start -- ..\..\test_assoc.rdoc`
- Deep link: `rdoc://open?path=C:\path\to\file.rdoc`

Folders are rejected with a clear message.

## Features (0.3.0)

| Feature | Notes |
| --- | --- |
| Recent files | Local JSON under Electron `userData` — clear / remove; no cloud |
| Integrity badge | ✓/✗ `contentHash` (+ CSP / manifest) in a fixed shell chip |
| Theme chrome | Mirrors document `data-theme` / system; Windows title-bar overlay + mica |
| Set as default | In-app help + Windows Default Apps deep link |
| Auto-update check | Optional GitHub Releases probe — **OFF by default** (Settings) |
| Protocol | `rdoc://` registered; second-instance focuses + opens path |

## Build installers

```powershell
cd apps/desktop-reader
npm install
npm run pack          # Windows: portable + NSIS
# npm run pack:msi    # MSI (optional; needs WiX on PATH)
# npm run pack:all    # portable + NSIS + MSI
# npm run pack:mac    # macOS: dmg + zip (run on macOS)
# npm run pack:linux  # Linux: AppImage + deb
```

CI: push tag `v*` / `reader-v*` → [`.github/workflows/release-readers.yml`](../../.github/workflows/release-readers.yml). Packaging stubs: [`packaging/`](../../packaging/).

Typical Windows output under `dist-pack/`:

- `rdoc-reader-0.3.0-win-x64-portable.exe` — **portable**
- `rdoc-reader-0.3.0-win-x64-setup.exe` — **NSIS** (file associations + Start Menu)
- `rdoc-reader-0.3.0-win-x64.msi` — **MSI** (when WiX is available)

If packaging fails partway:

```powershell
npm run pack:dir
```

Then zip `dist-pack/win-unpacked/`.

### Code signing (Authenticode) — deferred

**Do not fake signing.** Release binaries are currently **unsigned**.

When a real certificate is available:

1. Set `CSC_LINK` / `CSC_KEY_PASSWORD` (or `WIN_CSC_*`).
2. In `package.json` → `build.win`, set `"signAndEditExecutable": true`.
3. Optionally point `"sign": "./scripts/sign-windows.js"` (hook refuses to run without certs).

See comments in [`scripts/sign-windows.js`](scripts/sign-windows.js).

## Portable vs installed

| | **Portable** | **NSIS / MSI installed** |
| --- | --- | --- |
| Location | Anywhere you copy the `.exe` | `%LOCALAPPDATA%\Programs\rdoc Reader` (typical) |
| PATH | Not added | Not added (use Start Menu / file association) |
| Default app / associations | Manual “Open with → Always” | Registered for `.rdoc` / `.rdoc.html` + `rdoc://` at install |
| Uninstaller | Delete the exe | Apps & features / uninstaller removes app; `userData` kept unless you delete it |
| Updates | Replace the exe from GitHub Releases | Install newer setup (or replace portable) |
| Protocol `rdoc://` | May work after one run via `setAsDefaultProtocolClient` | Registered by electron-builder |

Recent files and settings live in Electron `userData` for both editions (not inside the portable exe).

## OS file association

**Installed:** use the NSIS/MSI builder targets — associations are declared in `package.json` `build.fileAssociations`.

**Portable / from source:** File → **Set as default app…**, or:

```text
"C:\path\to\rdoc-reader-0.3.0-win-x64-portable.exe" "%1"
```

The CLI still ships `rdoc associate` for **browser-based** opening; this reader is the native alternative for bare `.rdoc`.

## Deep links

```text
rdoc://open?path=C:\docs\note.rdoc
```

A second instance forwards the path to the running window (single-instance lock).

## Icon / branding

Window and installer icons come from [`../shared/branding/`](../shared/branding/) (`icon.ico` / `icon.png` in this folder).

## License

MIT — same as the [rdoc](https://github.com/DokaiiMob/rdoc) project.
