# IANA media type notes: `application/vnd.rdoc+html`

Informational registration-path notes for the preferred RDOC media type defined in [RFC 0001](./rfc-0001-rdoc.md) §4 / §16. This document is **not** a submitted IANA registration; it records what a vendor-tree filing should contain.

## Tree and type

| Item | Value |
| --- | --- |
| Type name | `application` |
| Subtype name | `vnd.rdoc+html` |
| Tree | Vendor (`vnd.`) |
| Template | [RFC 6838](https://www.rfc-editor.org/rfc/rfc6838) media type registration |
| Structured syntax suffix | `+html` (payload is HTML5 polyglot) |

Until IANA assignment is complete, implementations MAY serve RDOC files as `text/html; charset=utf-8`.

## Suggested template fields

| Field | Suggested content |
| --- | --- |
| **Type name** | application |
| **Subtype name** | vnd.rdoc+html |
| **Required parameters** | none |
| **Optional parameters** | `charset` — if present, MUST be `utf-8` (files are UTF-8; see RFC §5.1) |
| **Encoding considerations** | 8bit / binary-safe UTF-8; no transfer encoding required beyond the enclosing protocol |
| **Security considerations** | See below and RFC §10 |
| **Interoperability considerations** | See below |
| **Published specification** | RFC 0001 in this repository (`docs/rfc-0001-rdoc.md`) |
| **Applications that use this media type** | RDOC CLI / readers; any HTML user agent as fallback |
| **Fragment identifier considerations** | Same as `text/html` (HTML element `id` fragments); RDOC does not define a separate fragment grammar |
| **Additional information** | Magic number: none beyond HTML `<!DOCTYPE html>` + embedded `application/rdoc+json` manifest; File extensions: `.rdoc`, `.rdoc.html`; Macintosh file type code: n/a |
| **Person & email contact** | Project maintainers of the RDOC reference implementation (update with a stable contact before filing) |
| **Intended usage** | COMMON |
| **Restrictions on usage** | none |
| **Author** | RDOC project |
| **Change controller** | RDOC project / specification editors |

## Encoding

- Documents MUST be UTF-8 without a leading BOM (RFC §5.1).
- When `charset` is signaled (HTTP `Content-Type`, data URL, etc.), it MUST be `utf-8`.
- Line endings in storage MAY be LF or CRLF; integrity hashing canonicalizes article text independently (RFC §7).

## Security considerations (summary for registration)

- Documents are HTML and execute in a browsing context; treat as untrusted active content.
- Producers SHOULD embed a restrictive CSP meta tag (`default-src 'none'`, no network `connect-src`) as described in RFC §5.2 / §10.
- Compilers SHOULD strip dangerous article constructs (`script`, `iframe`, inline event handlers) before packaging.
- Sidecar annotation and book-spine JSON are not executable but MUST be validated / ignored safely (unknown fields ignored; no code evaluation).

## Fragmentation

Fragment identifiers follow HTML rules (`#element-id`). No RDOC-specific fragment syntax is defined in 1.x. Annotation locators live in annotation JSON (`startPath` / offsets), not in URL fragments.

## Interoperability with `text/html` and `.rdoc.html`

| Concern | Guidance |
| --- | --- |
| Unknown OS / messenger | Prefer distributing `.rdoc.html` so generic handlers open the file as HTML |
| HTTP without registered type | Serve `text/html; charset=utf-8` or `application/vnd.rdoc+html` if the client is known to understand it |
| Sniffing | Payload is valid HTML5; browsers that ignore the vendor type still render when served or renamed as HTML |
| Association | OS handlers for `.rdoc` SHOULD ensure HTML semantics (e.g. temporary `.rdoc.html` copy) per RFC §11 |

## Filing path

1. Finalize contact and change-controller details.
2. Complete the vendor-tree registration form per IANA / RFC 6838.
3. Publish the accepted media type string and any IANA URL back into RFC §16 and this document.
