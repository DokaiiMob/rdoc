# Save page as .rdoc (MV3)

Browser extension MVP for [#3](https://github.com/DokaiiMob/rdoc/issues/3): extract the main article from the current tab, wrap it as a self-contained RDOC polyglot (CSP + manifest + `contentHash`), and download `*.rdoc.html`.

## Load (unpacked)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this directory (`extensions/save-as-rdoc`).
4. Open any article page → click the extension icon → **Save as .rdoc**.

Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → pick `manifest.json`.

## What it does

| Step | Behavior |
| --- | --- |
| Extract | Prefer `<article>` / `<main>` / Readability-ish largest text block; strip scripts, iframes, forms, nav chrome |
| Sanitize | Drop `on*` handlers; external `http(s)` images become placeholders (offline CSP) |
| Package | Inline minimal reader CSS; embed `application/rdoc+json` + SHA-256 `contentHash` (NFC + LF) |
| Download | `{title}.rdoc.html` via `chrome.downloads` |

## Limits (MVP)

- Not published to Chrome Web Store / AMO yet (see ROADMAP).
- No full reference reader chrome (TOC / theme / footnotes) — compact reading stylesheet only.
- Complex SPAs may yield thin extracts; prefer article-shaped pages.
- Does not call the Node CLI; hashing uses Web Crypto in the service worker.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | MV3 manifest |
| `background.js` | Build polyglot + download |
| `content.js` | DOM extract + sanitize |
| `popup.html` / `popup.js` | One-click UI |
| `icons/` | Toolbar icons |
