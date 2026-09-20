# Publishing

Notes for releasing the `rdoc` CLI and related container image.

## Package name

`package.json` keeps **`"name": "rdoc"`**.

| Name | Approach |
| --- | --- |
| `rdoc` | **Preferred.** Matches the binary name and current `package.json`. Publish to the public npm registry when the name is available to the maintainer account. |
| `@rdoc/cli` | Fallback scoped name if the unscoped `rdoc` name is taken or reserved. Would require changing `"name"` (and optionally documenting a second bin package). Prefer reclaiming / publishing as `rdoc` when possible. |

Do **not** publish under a different unscoped name without updating docs, Homebrew/Scoop/Winget stubs, and the Docker entrypoint story together.

## Prerequisites

1. npm account with 2FA
2. Access to the GitHub repo `DokaiiMob/rdoc`
3. Built artifacts: `npm ci && npm run build` (ships `dist/`)
4. Confirm `"bin": { "rdoc": "./dist/cli.js" }` and that `dist/` is not gitignored incorrectly for the pack

### Files included in the npm pack

Before the first publish:

```bash
npm pack --dry-run
```

Ensure the tarball contains at least:

- `package.json`
- `dist/**` (CLI + template assets)
- `README.md` / `LICENSE`

Add a `"files"` field in `package.json` if the dry-run pulls in unwanted paths (`site/`, `plugins/`, tests, etc.).

## npm publish steps

```bash
# 1. Clean install + build
npm ci
npm run build

# 2. Sanity check
node dist/cli.js --help
node dist/cli.js init demo -o /tmp/rdoc-sample.md
node dist/cli.js build /tmp/rdoc-sample.md -o /tmp/out.rdoc.html
node dist/cli.js inspect /tmp/out.rdoc.html

# 3. Version (choose one)
npm version patch   # or minor / major
# edit package.json manually if you prefer, then commit

# 4. Publish
npm login
npm publish --access public

# If using the scoped fallback later:
# npm publish --access public   # with name @rdoc/cli
```

Tag the GitHub release to match `package.json` `version` (e.g. `v0.1.0`).

### Install from npm (consumers)

```bash
npm install -g rdoc
rdoc --help
```

## Docker image (GHCR)

Multi-stage `Dockerfile` at the repo root builds with `node:20-alpine` and sets:

```text
ENTRYPOINT ["node", "dist/cli.js"]
```

### Build and push example

```bash
VERSION=0.1.0
IMAGE=ghcr.io/dokaiimob/rdoc

docker build -t "${IMAGE}:${VERSION}" -t "${IMAGE}:latest" .

echo "$GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
docker push "${IMAGE}:${VERSION}"
docker push "${IMAGE}:latest"
```

### Run

```bash
docker run --rm -v "$PWD:/work" -w /work ghcr.io/dokaiimob/rdoc:latest \
  build sample.md -o sample.rdoc.html
```

On Windows PowerShell, adjust volume mounts (`${PWD}:/work`) as needed.

## Checklist before a release

- [ ] `README.md` / `README.ru.md` quick start still accurate ([policy](README-POLICY.md))
- [ ] RFC / roadmap links valid
- [ ] Completions under `completions/` match CLI surface
- [ ] Packaging stubs (`packaging/`) version/url placeholders updated if cutting a real formula/manifest
- [ ] Docker image tagged and pushed (optional but recommended for CLI reproducibility)
