# F-Droid metadata sketch (rdoc Android Reader)

This directory is a **maintainer sketch**, not a live F-Droid submission. It documents how a reproducible package could be built from this monorepo and what is still missing for real inclusion.

## Layout

| File | Role |
| --- | --- |
| [`com.rdoc.reader.yml`](com.rdoc.reader.yml) | fdroiddata-style YAML recipe (preferred modern format) |
| [`metadata/com.rdoc.reader.yml`](metadata/com.rdoc.reader.yml) | Same content under a `metadata/` tree for copy-paste into an fdroiddata clone |

## Unsigned / debug limitations

- Day-to-day CI and GitHub Releases may ship **`assembleDebug`** APKs when no release keystore is configured. Debug APKs use `applicationId` suffix `.debug` → `com.rdoc.reader.debug` and are **not** what F-Droid publishes.
- **`assembleRelease`** without signing produces an **unsigned** APK. F-Droid **re-signs** with its own key during its build; upstream unsigned release builds are fine as a reference, but the recipe must build from source inside F-Droid’s environment.
- Play Store **AAB** is out of scope for F-Droid; F-Droid wants APK (or their own packaging) built from the recipe.
- Binary GitHub Release APKs must **not** be the sole trust path for F-Droid — inclusion requires a clean source build.

## What maintainers need for real F-Droid inclusion

1. **Stable `AutoName` / `PackageName`**: `com.rdoc.reader` (release variant, no `.debug` suffix).
2. **Versioning**: bump `versionCode` / `versionName` in `apps/android-reader/app/build.gradle` for every F-Droid release; keep `CurrentVersion` / `CurrentVersionCode` in metadata in sync.
3. **Reproducible Gradle path**: JDK 17, Android SDK compileSdk 35, no proprietary Google Play deps (current app uses AppCompat + Activity only — good).
4. **Source tarball or git tag** matching the release; prefer building from the tagged monorepo subdirectory `apps/android-reader`.
5. **No prebuilt jars** beyond what Gradle resolves from Maven Central / Google Maven.
6. **AntiFeatures** declaration if WebView loads arbitrary user documents (often none required for a local file viewer; confirm with F-Droid review).
7. **License**: MIT (repo root `LICENSE`).
8. **Update check**: `UpdateCheckMode: Tags` or Gradle `versionName` parse — adjust once tags are regular (`v*` vs `reader-v*`).
9. Submit a merge request to [fdroiddata](https://gitlab.com/fdroid/fdroiddata) with this YAML + screenshots / description polish.
10. Optional: enable reproducible APK verification (`Binaries:` + matching CI artifact) only after unsigned/release builds are bit-stable.

## Local dry-run (developers)

```powershell
cd apps\android-reader
.\gradlew.bat assembleRelease
# unsigned: app\build\outputs\apk\release\app-release-unsigned.apk
.\gradlew.bat assembleDebug
# debug:    app\build\outputs\apk\debug\app-debug.apk
```

For F-Droid’s buildserver, the YAML `prebuild` / `build` steps mirror Gradle; do not rely on `local.properties` — SDK paths come from the buildserver.
