# RDOC conformance suite

Fixtures and a Node ESM runner that assert RFC 0001 structural and integrity rules.

## Fixtures

| File | Expected |
| --- | --- |
| `fixtures/valid-minimal.rdoc.html` | Pass — CSP, single `#rdoc-content`, valid `contentHash` |
| `fixtures/fail-bad-hash.rdoc.html` | Fail — wrong `contentHash` |
| `fixtures/fail-no-csp.rdoc.html` | Fail — missing CSP meta |
| `fixtures/fail-multi-article.rdoc.html` | Fail — two `article#rdoc-content` |

## Run

From the repo root (after `npm run build` preferred so hash checks use `dist/validator.js`):

```powershell
npm run build
npm run test:conformance
```

Or directly:

```powershell
node tests/conformance/run.mjs
```

Exit code `0` only when every fixture’s actual pass/fail matches the table above. If `dist/validator.js` is missing, the runner falls back to the same NFC + LF + SHA-256 algorithm inline.
