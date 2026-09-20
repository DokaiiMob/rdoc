# Threat model — Responsive Document (`.rdoc`)

## Assets

| Asset | Why it matters |
| --- | --- |
| Article HTML integrity | Readers trust what they see matches what the author published |
| Authorship / non-repudiation | Optional Ed25519 over `contentHash` (RFC 0002) |
| Reader privacy | Offline-first; no ambient network on open |
| Host integrity | Mirrors / CDNs must not silently alter bytes |

## Adversaries

- Malicious Markdown/HTML author (or compromised build input)
- On-path / mirror attacker replacing a hosted `.rdoc`
- Curious reader tooling that over-fetches (`authorKeys`, analytics)

## Threat → mitigation map

| Threat | Example | Mitigation |
| --- | --- | --- |
| **Stored XSS** | `<script>`, inline `onclick=`, `<iframe>` in article | `sanitizeArticleHtml` at compile; CSP still limits network; fuzz tests (`npm run test:fuzz`) |
| **Tracking pixels** | `<img src="https://tracker/…">` | Compiler rejects remote images; CSP `img-src data: blob:` + `connect-src 'none'` |
| **Exfiltration via `fetch`/XHR** | Reader or injected script phones home | CSP `connect-src 'none'`, `default-src 'none'` |
| **Exfiltration via CSS** | `background: url(https://…)` | CSP blocks remote style/img loads; no external stylesheets at compile |
| **SVG scripts** | `<svg><script>` / event handlers | Sanitize strips `<script>` / `on*`; prefer avoiding untrusted SVG; see HARDENING residual risks |
| **Form exfiltration** | Hidden form POST to evil origin | CSP `form-action 'none'` |
| **Clickjacking** | Embedding doc in attacker frame | CSP `frame-ancestors 'none'` |
| **Silent tampering** | CDN serves altered article | `contentHash` (RFC 0001); `rdoc validate` |
| **Spoofed authorship** | Attacker rebuilds with new hash | Optional Ed25519 signature / `.rdoc.sig`; verify against known key |
| **Forced key fetch** | Reader phones `authorKeys` on open | Spec: MUST NOT; CLI `--fetch-keys` default OFF |
| **Split chrome supply chain** | CDN swaps `runtime.js` | Discouraged; see [SRI-NOTES.md](./SRI-NOTES.md) |

## Non-goals

- Protecting against a fully compromised local machine
- Making every browser CSP quirk identical on ancient engines
- Proving natural-language claims inside a signed document

## Related

- [HARDENING.md](./HARDENING.md)
- [RFC 0002](./rfc-0002-signatures.md)
- [RFC 0001](./rfc-0001-rdoc.md) § CSP / hash
