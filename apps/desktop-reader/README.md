# rdoc Desktop Reader

Minimal **Electron** app that opens bare `.rdoc` (and `.rdoc.html`) files as HTML — without renaming the extension.

The file is served over a custom `rdoc://` protocol with `Content-Type: text/html`, so Chromium applies HTML semantics despite the `.rdoc` extension.

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

- **File → Open** (`Ctrl+O`)
- Drag & drop a `.rdoc` onto the window
- CLI: `npm start -- ..\..\test_assoc.rdoc` (or pass a path after `electron .`)

## Build Windows portable

```powershell
cd apps/desktop-reader
npm install
npm run pack
```

Output (typical):

- `dist-pack/rdoc-reader-0.2.0-win-x64-portable.exe`

If code signing / portable packaging fails:

```powershell
npm run pack:dir
```

Then zip the folder under `dist-pack/win-unpacked/`.

## OS file association (optional)

Point Windows “Open with” / ProgID at the portable exe:

```text
"C:\path\to\rdoc-reader-0.2.0-win-x64-portable.exe" "%1"
```

The CLI still ships `rdoc associate` for browser-based opening; this reader is an alternative for bare `.rdoc` without renaming.

## Icon / branding

Window and installer icons come from [`../shared/branding/`](../shared/branding/) (`icon.ico` / `icon.png` in this folder).

## License

MIT — same as the [rdoc](https://github.com/DokaiiMob/rdoc) project.
