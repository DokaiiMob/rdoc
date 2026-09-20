# rdoc Android Reader

Minimal Kotlin + WebView app that opens bare `.rdoc` files as HTML (UTF-8) without renaming to `.rdoc.html`.

**Version:** 0.3.0 · minSdk 24 · targetSdk 35

## Requirements

- Android Studio Ladybug+ **or** JDK 17+ and Android SDK (API 35)
- `ANDROID_HOME` / `local.properties` `sdk.dir`

## Open from source (Android Studio)

1. Open `apps/android-reader/` as a project
2. Sync Gradle
3. Run on a device/emulator

## Build debug APK (CLI)

```powershell
cd apps\android-reader
# if local.properties is missing:
# echo sdk.dir=C:/Users/YOU/AppData/Local/Android/Sdk > local.properties
.\gradlew.bat assembleDebug
```

APK path:

```text
app\build\outputs\apk\debug\app-debug.apk
```

## Release / Play Store (signed APK + AAB)

Unsigned release builds work without a keystore (smoke tests only). For Play upload, configure signing and run `bundleRelease` — see **[`docs/PLAY_RELEASE.md`](docs/PLAY_RELEASE.md)** and [`keystore.properties.example`](keystore.properties.example).

Listing copy, privacy draft, rating notes, screenshot sizes: **[`store/`](store/)**.

```powershell
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

## Behavior

- **Open…** → Storage Access Framework (`ACTION_OPEN_DOCUMENT`) with persistable read grants when the provider allows
- **Recent** → local SharedPreferences (URI + title; clearable; no cloud); reopen uses persisted URI permissions when still valid
- `ACTION_VIEW` / `ACTION_SEND` / `ACTION_SEND_MULTIPLE` for `.rdoc`, HTML MIME types, octet-stream, and `pathPattern`
- Material 3 + **Material You** dynamic color (API 31+ when available)
- **Edge-to-edge** system bars; WebView padded for navigation gestures
- **Predictive back:** WebView `canGoBack()` then finish (`OnBackPressedDispatcher` + `enableOnBackInvokedCallback`)
- **Home-screen widget:** “Open last document” (or launch app if none)
- Loads bytes as UTF-8 via `WebView.loadDataWithBaseURL(..., "text/html", "utf-8", ...)`
- JavaScript enabled for the document micro-runtime

### “Always open with rdoc Reader”

1. Open a `.rdoc` from Files / Downloads / a messenger
2. Choose **rdoc Reader** → **Always** (wording varies by OEM)
3. Intent-filters cover `content://` + `file://`, MIME types, and `pathPattern` for `*.rdoc` / `*.rdoc.html` (including nested path segments)

If another app remains default: long-press the file → Open with → rdoc Reader → Always, or clear defaults under system App info.

## Icon

Launcher adaptive icons use the shared mark from [`apps/shared/branding/`](../shared/branding/).

## License

MIT — same as the [rdoc](https://github.com/DokaiiMob/rdoc) project.
