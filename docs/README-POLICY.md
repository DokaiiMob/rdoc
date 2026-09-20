# README language policy

## Canonical language

**English is canonical** for the project overview and contributor-facing docs:

| File | Role |
| --- | --- |
| [`README.md`](../README.md) | Canonical project overview (English) |
| [`README.ru.md`](../README.ru.md) | Russian translation of the overview |

Specification and technical docs under `docs/` (RFC, publishing, Bun/Deno notes, this policy) are written in **English** unless a file is explicitly named for another locale (e.g. `*.ru.md`).

## What must stay in sync

When either overview README changes, the other MUST be updated for:

1. **Quick start** — clone, install, build, and the same example CLI sequence
2. **CLI command table** — command names, arguments, and short purpose
3. **Build flags** — `-o`, `-t`, `-a`, `-l`, `-d`, and any documented long options (`--watch` when shipped)
4. **Requirements** — Node version and other hard prerequisites
5. **Links** that are part of the product story (demo, RFC, license, repo)

The Russian README **need not** duplicate every badge, typing SVG, skill icon, or repo-stats widget from the English README. Prefer a clear, useful translation over visual parity.

## Who updates first

1. Change the **English** `README.md` first (canonical).
2. Update `README.ru.md` in the **same PR** when the synced sections above change.
3. If you only fix Russian wording/typos, English need not change — note that in the PR description.

## Suggested one-liner for the English README

Do not rewrite the flashy root README for localization. Optionally add a short line near the top links, for example:

```markdown
[Русский](README.ru.md) · Docs language: English is canonical — see [README policy](docs/README-POLICY.md).
```

## Other translated files

- New locale files SHOULD use the pattern `README.<locale>.md` or `docs/<name>.<locale>.md`.
- Locale files are translations; they MUST NOT introduce conflicting install steps or CLI semantics.
