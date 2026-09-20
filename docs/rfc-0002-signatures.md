# RFC 0002 — Ed25519 signatures in the RDOC manifest

| | |
| --- | --- |
| **Status** | Draft |
| **Depends on** | [RFC 0001](./rfc-0001-rdoc.md) (Accepted, format 1.x) |
| **Created** | 2026-09-20 |
| **Tracking** | [#4](https://github.com/DokaiiMob/rdoc/issues/4) |

## 1. Motivation

`contentHash` (RFC 0001 §7) proves **bit integrity** of the article HTML. It does not prove **authorship** or non-repudiation. Contracts, specs, and mirrors need an optional signature so a reader can check that a known key attested a specific hash.

## 2. Scope

- Optional manifest fields for an **Ed25519** signature over `contentHash`.
- Optional detached sidecar `.rdoc.sig` (same crypto; document body unchanged).
- Optional `authorKeys` URL for key discovery (**never** required to open a document).
- Reference CLI: `rdoc keygen`, `rdoc sign`, `rdoc verify`.
- Out of scope for this draft: PKI, timestamping authorities, multi-sig.

## 3. Design principles

1. **Optional** — documents without a signature remain valid RDOC 1.x.
2. **Does not affect `contentHash`** — signature fields live only in the manifest; article HTML is unchanged.
3. **Reading never requires keys** — unsigned and signed docs open the same way; verification is an explicit tooling step.
4. **Sign the hash, not the whole file** — the signed message is the 32 raw bytes of `contentHash` (decoded from lowercase hex).

## 4. Manifest fields

When present, producers MUST include an object:

```json
{
  "signature": {
    "alg": "Ed25519",
    "publicKey": "<base64 of 32-byte raw public key>",
    "sig": "<base64 of 64-byte signature>",
    "keyId": "<optional opaque id>"
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `signature.alg` | yes | Constant `"Ed25519"` |
| `signature.publicKey` | yes | Standard Base64 of the **raw** 32-byte Ed25519 public key |
| `signature.sig` | yes | Standard Base64 of the 64-byte Ed25519 signature |
| `signature.keyId` | no | Hint for humans / keyrings (e.g. truncated SHA-256 of `publicKey`) |

Readers and validators that do not implement RFC 0002 MUST ignore the `signature` object (RFC 0001 version negotiation).

Optional key discovery hint (manifest root, not inside `signature`):

| Field | Required | Notes |
| --- | --- | --- |
| `authorKeys` | no | Absolute URL of a JSON key list; **MUST NOT** be fetched by readers when opening |

### 4.1 Detached sidecar (`.rdoc.sig`)

Producers MAY write a sibling file `<path>.rdoc.sig` instead of (or in addition to) embedding `signature`:

```json
{
  "format": "rdoc-sig",
  "version": "1",
  "contentHash": "<64 lowercase hex>",
  "alg": "Ed25519",
  "publicKey": "<base64>",
  "sig": "<base64>",
  "keyId": "<optional>"
}
```

CLI: `rdoc sign <file> -k <pem> --detached` → writes `<file>.rdoc.sig`.

## 5. Signing procedure

1. Parse the embedded `application/rdoc+json` manifest.
2. Verify `contentHash` matches the article inner HTML (RFC 0001 §7) before signing.
3. Decode `contentHash` from 64 lowercase hex characters → 32 bytes.
4. Sign those 32 bytes with Ed25519 (PureEdDSA; no prehash algorithm OID in the Node/WebCrypto sense — the message is the raw digest bytes).
5. Write `signature` into the manifest and rewrite the `<script type="application/rdoc+json">` block. Do **not** recompute `contentHash`.

## 6. Verification procedure

1. Extract manifest and article; fail if `contentHash` mismatch.
2. Resolve signature from embedded `manifest.signature`, else sidecar `<file>.rdoc.sig` (or `--sig`).
3. If no signature → report `unsigned` (exit 0 for `rdoc verify --allow-unsigned`).
4. Require `alg === "Ed25519"`, decode `publicKey` and `sig`.
5. Optionally (`rdoc verify --fetch-keys`, default OFF): fetch `authorKeys` and require the public key to be listed.
6. Verify Ed25519 over the 32-byte `contentHash` digest.
7. Success only if both hash and signature verify.

## 7. Key material (reference CLI)

| Artifact | Format |
| --- | --- |
| Private key | PEM `PRIVATE KEY` (PKCS#8 Ed25519) |
| Public key | PEM `PUBLIC KEY` (SPKI) or raw Base64 for manifest embedding |

`rdoc keygen` writes a key pair. `rdoc sign --key <priv.pem>` embeds the matching raw public key into the manifest.

## 8. Security considerations

- Treat private keys as secrets; never embed them in documents.
- A valid signature only binds **hash ↔ key**. It does not prove the key belongs to a named author without an out-of-band trust decision.
- Compromised keys require re-signing or revocation lists (future work).
- Do not weaken CSP or allow network key fetch as a reading requirement.

## 9. Compatibility

- Format `version` stays on the 1.x line; `signature` is additive (MINOR semantics when this RFC is Accepted).
- Until Accepted, producers MAY emit `signature` and MUST tolerate consumers that ignore it.

## 10. Reference implementation

| Path | Role |
| --- | --- |
| `src/sign.ts` | keygen / sign / verify helpers |
| `src/cli.ts` | `rdoc keygen`, `rdoc sign`, `rdoc verify` |
| `docs/rfc-0002-signatures.md` | this document |

## 11. Future work

- Multi-signature / threshold schemes
- Revocation lists / key rotation UX
- Community review → Status: Accepted
