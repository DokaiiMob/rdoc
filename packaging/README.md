# Packaging stubs (CLI + readers)

Manifests under this tree are **stubs** until each GitHub Release publishes the matching assets and hashes. They are not auto-submitted to Scoop / winget / Homebrew upstream.

| Package | Path | Typical release asset |
| --- | --- | --- |
| CLI (Scoop) | [`scoop/rdoc.json`](scoop/rdoc.json) | `rdoc-windows-x64.zip` |
| CLI (winget) | [`winget/DokaiiMob.rdoc.yaml`](winget/DokaiiMob.rdoc.yaml) | same |
| CLI (Homebrew formula) | [`homebrew/rdoc.rb`](homebrew/rdoc.rb) | source tarball or npm build |
| **Reader** (Scoop) | [`scoop/rdoc-reader.json`](scoop/rdoc-reader.json) | `rdoc-reader-<ver>-win-x64-portable.exe` |
| **Reader** (winget) | [`winget/DokaiiMob.rdoc.Reader.yaml`](winget/DokaiiMob.rdoc.Reader.yaml) | portable EXE (+ optional NSIS) |
| **Reader** (Homebrew cask) | [`homebrew/rdoc-reader.rb`](homebrew/rdoc-reader.rb) | `rdoc-reader-<ver>-mac-{arm64,x64}.zip` |
| **Android / F-Droid** | [`fdroid/`](fdroid/) | APK from `release-readers` workflow |

Related:

- Release automation: [`.github/workflows/release-readers.yml`](../.github/workflows/release-readers.yml)
- Checksums / SBOM: [`docs/SBOM-READERS.md`](../docs/SBOM-READERS.md)

## How to cut a reader release

1. Ensure `apps/desktop-reader/package.json` `version` (and Android `versionName` / `versionCode` if shipping APK) match the tag you will push.
2. Push a tag: `v0.3.1` or `reader-v0.3.1` (workflow matches `v*` and `reader-v*`).
3. Wait for **Release readers** to build and attach assets + `SHA256SUMS` (and optional SBOM) to the GitHub Release.
4. Update packaging stubs with the new version, URLs, and hashes (below).
5. Optionally PR the updated manifests to community buckets / winget-pkgs / a Homebrew tap.

## Updating hashes after each release

Release workflow uploads `SHA256SUMS` next to the binaries. Use that file, or compute locally:

```powershell
# Windows PowerShell — portable reader example
Get-FileHash .\rdoc-reader-0.3.0-win-x64-portable.exe -Algorithm SHA256
```

```bash
# macOS / Linux
shasum -a 256 rdoc-reader-*.zip rdoc-reader-*.dmg rdoc-reader-*.AppImage
# or:
sha256sum rdoc-reader-*
```

### Scoop (`rdoc-reader.json`)

1. Set `"version"` to the release version (no `v` prefix).
2. Set `"url"` to the portable EXE download URL.
3. Set `"hash"` to `sha256:<64-hex>` (Scoop accepts bare hex too).
4. Align `"bin"` / `"shortcuts"` filenames with the artifact name (includes version today).

### winget (`DokaiiMob.rdoc.Reader.yaml`)

1. Set `PackageVersion`.
2. Set each `InstallerUrl` to the Release asset.
3. Set `InstallerSha256` to the **uppercase or lowercase** 64-hex from `SHA256SUMS` (no `sha256:` prefix).
4. Before upstream submission, split into the multi-file winget schema if required by winget-pkgs.

### Homebrew cask (`rdoc-reader.rb`)

1. Set `version "…"`.
2. Set `url` per arch (`on_arm` / `on_intel`) to the zip (or switch to `.dmg` URLs if you prefer).
3. Set each `sha256` from `SHA256SUMS`.
4. Confirm `app "rdoc Reader.app"` matches the unzipped layout; adjust if electron-builder nests differently.

### CLI stubs

Same process for [`scoop/rdoc.json`](scoop/rdoc.json), [`winget/DokaiiMob.rdoc.yaml`](winget/DokaiiMob.rdoc.yaml), and [`homebrew/rdoc.rb`](homebrew/rdoc.rb) when CLI zips/tarballs are published.

## Signing / store status

| Channel | Status |
| --- | --- |
| Windows Authenticode | Deferred — unsigned portable/NSIS OK for GitHub Releases |
| macOS notarization | Deferred — unsigned zip/dmg; Gatekeeper may block until “Open Anyway” |
| Android Play / AAB | Optional in CI when `ANDROID_KEYSTORE_*` secrets exist; otherwise debug or unsigned release APK |
| F-Droid | Recipe sketch only — see [`fdroid/README.md`](fdroid/README.md) |

Do **not** invent fake certificate hashes or pretend builds are signed.
