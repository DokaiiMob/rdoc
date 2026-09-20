# Subresource integrity notes (discouraged pattern)

RDOC’s design embeds reader CSS and JS **inside** the HTML polyglot so a single file opens offline with a stable `contentHash` over article content.

## Why separate chrome is discouraged

Hosting `reader.css` / `runtime.js` on a CDN or static host:

- Breaks the “one file, no network” promise
- Creates a supply-chain surface: chrome can change without touching `contentHash`
- Forces CSP exceptions (`script-src` / `style-src` hosts) that weaken exfiltration defenses

Prefer the reference compiler output (inline `<style>` + `<script>`).

## If you must host chrome separately

Use this only for experimental hosted viewers, not as the canonical `.rdoc` distribution:

1. Pin exact bytes with [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity):

   ```html
   <script src="https://cdn.example/rdoc-runtime.js"
           integrity="sha384-…"
           crossorigin="anonymous"></script>
   ```

2. Mirror the same digests in CSP (`script-src` / `style-src` with hashes or strict hosts).
3. Document that the **article** integrity is still `manifest.contentHash`; chrome integrity is a **separate** trust decision.
4. Never require SRI fetch success to “read” a local `.rdoc` — keep a fully inlined fallback.

## Relationship to signatures

Ed25519 (RFC 0002) signs `contentHash` of article HTML only. It does **not** cover external chrome URLs. Detached `.rdoc.sig` files likewise bind hash↔key, not CDN assets.
