# Checksums and SBOM notes (native readers)

This document covers **desktop** (`apps/desktop-reader`) and **Android** (`apps/android-reader`) release assets — not the CLI npm package.

## Checksums (SHA-256)

### Automated (GitHub Actions)

Workflow [`.github/workflows/release-readers.yml`](../.github/workflows/release-readers.yml) (`Release readers`):

1. Builds platform artifacts on tag `v*` or `reader-v*`.
2. Collects published binaries into a staging directory.
3. Writes a top-level **`SHA256SUMS`** file (GNU `sha256sum` / PowerShell equivalent).
4. Uploads `SHA256SUMS` to the same GitHub Release as the installers/APKs.

Verify after download:

```bash
sha256sum -c SHA256SUMS
# macOS (if sha256sum missing):
shasum -a 256 -c SHA256SUMS
```

```powershell
# Spot-check one file against SHA256SUMS
Get-FileHash .\rdoc-reader-0.3.0-win-x64-portable.exe -Algorithm SHA256
```

Optional per-asset sidecars (`*.sha256`) may also be attached; prefer the aggregated `SHA256SUMS` when present.

### Manual (if CI skipped a platform)

```bash
cd /path/to/downloaded/assets
sha256sum rdoc-reader-* app-*.apk > SHA256SUMS
```

Then attach `SHA256SUMS` to the Release and update [`packaging/`](../packaging/) stub hashes — see [`packaging/README.md`](../packaging/README.md).

## SBOM approach

We do **not** require a proprietary SBOM SaaS. Prefer open tools when available in CI; otherwise document lockfile pointers for auditors.

| Component | Lock / provenance | SBOM generation |
| --- | --- | --- |
| Desktop reader (Electron) | `apps/desktop-reader/package-lock.json` | Optional CycloneDX / SPDX via `syft` or `@cyclonedx/cyclonedx-npm` |
| Android reader | Gradle + Maven coordinates in `apps/android-reader/app/build.gradle` (no committed Gradle lock yet) | Optional `syft` on the APK or project dir; or Gradle CycloneDX plugin later |
| Shared branding / docs | N/A (static assets) | Skip |

### CI (optional, best-effort)

The release workflow attempts to run **`syft`** packages directory / APK when the installer is available, uploading `sbom-*.spdx.json` or `sbom-*.cyclonedx.json` as Release assets. If `syft` is missing or fails, the job still publishes binaries + `SHA256SUMS` and leaves SBOM as a manual follow-up.

### Manual SBOM examples

```bash
# Desktop app directory (after npm ci)
syft apps/desktop-reader -o cyclonedx-json > sbom-desktop-reader.cyclonedx.json
# or
npx @cyclonedx/cyclonedx-npm --output-file sbom-desktop-reader.cyclonedx.json
# run from apps/desktop-reader after npm ci
```

```bash
# Android APK
syft rdoc-reader-*-android*.apk -o spdx-json > sbom-android-reader.spdx.json
```

Attach the JSON files to the GitHub Release next to `SHA256SUMS`.

## Trust notes

- **Unsigned** Windows/macOS builds: checksums prove integrity of the downloaded bytes, not publisher identity. Authenticode / notarization remain deferred.
- **Android**: debug APKs and unsigned release APKs are convenience artifacts; F-Droid / Play will re-sign or require store keys — see [`packaging/fdroid/README.md`](../packaging/fdroid/README.md).
- Do not paste placeholder SHA-256 values into production install docs; only publish hashes from a real `SHA256SUMS` for that tag.
