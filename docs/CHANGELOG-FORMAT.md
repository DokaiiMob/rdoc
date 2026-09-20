# RDOC format changelog

History of the Responsive Document (`.rdoc`) format dialect, as published in [RFC 0001](./rfc-0001-rdoc.md). This tracks the **format** SemVer (`manifest.version`), not the reference CLI release.

## 1.1.0 — 2026-09-20

- Optional manifest fields: `profile`, `canonicalUrl`, `license`, `rights`, `themeAccent` (CSS color for `--accent`).
- Version negotiation clarified: readers **MUST** ignore unknown manifest fields.
- Annotations note: sidecar `.rdoc.ann.json` or embedded `application/rdoc-annotations+json` (minimal highlight schema). See [annotations.md](./annotations.md) and RFC §17.
- Book / multi-article note: spine file `*.rdoc.book.json` (`format: "rdoc-book"`). See [book-profile.md](./book-profile.md) and RFC §18.
- Status of RFC 0001 moved from Draft to Accepted (MVP community review complete; errata still accepted).

## 1.0.0 — 2026-09-20

- Initial format: required skeleton, `application/rdoc+json` manifest, SHA-256 `contentHash` with NFC + LF canonicalization, CSP guidance, dual extension `.rdoc` / `.rdoc.html`, proposed media type `application/vnd.rdoc+html`.
