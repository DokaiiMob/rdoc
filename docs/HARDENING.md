# Hardening guide — opening untrusted `.rdoc`

This guide is for readers and publishers who handle **untrusted** Responsive Documents. Signatures (RFC 0002) prove hash↔key binding; they do not make hostile content safe by themselves.

## Offline-first rule

Opening a `.rdoc` MUST NOT require network access. Optional fields such as `authorKeys` or `canonicalUrl` are hints for tooling and humans — **never** a gate for rendering.

## `file://` vs hosted HTTP(S)

| Context | What you get | Residual risk |
| --- | --- | --- |
| **`file://`** (double-click / native reader) | No origin server; CSP still applies in modern browsers; no automatic `authorKeys` fetch | Local file access quirks vary by browser; treat the file as untrusted code+content |
| **Hosted** (https://…/doc.rdoc.html) | Same CSP in the document; server can add headers | Host can replace the file; use `contentHash` + optional signature to detect tampering |
| **`rdoc serve` / desktop reader** | Local loopback or app shell | Prefer validating hash before share; desktop reader already checks CSP + hash |

Prefer validating with `rdoc validate` / `rdoc verify` before redistributing.

## What the production CSP blocks

Every producer document embeds (enforcing):

```
default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';
style-src 'unsafe-inline'; img-src data: blob:; script-src 'unsafe-inline';
connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'
```

In practice this blocks:

- Network fetches (`connect-src 'none'`, `default-src 'none'`) — tracking pixels over HTTP, beacon APIs, remote fonts/scripts
- Nested browsing (`frame-ancestors 'none'`, no frames via object/embed policy)
- Form exfiltration (`form-action 'none'`)
- Remote images (only `data:` / `blob:` images)

It **allows** inline reader chrome CSS/JS (`'unsafe-inline'`) so the self-contained polyglot works offline.

Authors debugging CSP can build with `rdoc build --csp-report` to add a **Report-Only** meta alongside the enforcing policy (production policy unchanged).

## What remains risky

CSP is not a complete sandbox:

| Residual risk | Why |
| --- | --- |
| **XSS in article HTML** | Inline script is allowed for the reader runtime; malicious Markdown/HTML that survives sanitize can still run in-document. Mitigated by `sanitizeArticleHtml` at compile time + hash integrity after publish. |
| **SVG / data-URI tricks** | SVG can embed scripts or event handlers; sanitize strips common vectors but is not a full HTML5 parser. Prefer not embedding untrusted SVG. |
| **CSS-based probing** | Inline styles are allowed; attribute selectors / UI redress are limited but not zero. |
| **Social engineering** | A signed doc can still lie in plain text; signature ≠ endorsement of claims. |
| **Hosted chrome split** | Serving reader CSS/JS from a CDN is **discouraged** — see [SRI-NOTES.md](./SRI-NOTES.md). |

## Recommended workflow for untrusted files

1. `rdoc validate path/to/file.rdoc.html` — structure, CSP meta, `contentHash`.
2. `rdoc verify path/to/file.rdoc.html` — optional Ed25519 (embedded or `.rdoc.sig`).
3. Only then open in a browser / native reader.
4. Do **not** pass `--fetch-keys` unless you intentionally want network key discovery.

## Related docs

- [THREAT-MODEL.md](./THREAT-MODEL.md) — attack → mitigation map
- [RFC 0002](./rfc-0002-signatures.md) — signatures & `authorKeys`
- [SRI-NOTES.md](./SRI-NOTES.md) — if you ever host chrome separately
