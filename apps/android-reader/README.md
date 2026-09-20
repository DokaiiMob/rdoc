# rdoc Android Reader

Minimal Kotlin + WebView app that opens bare `.rdoc` files as HTML (UTF-8) without renaming to `.rdoc.html`.

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

## Behavior

- **Open…** menu → system file picker
- `ACTION_VIEW` / `ACTION_SEND` for `.rdoc`, `text/html`, `application/vnd.rdoc+html`, `*/*`
- Loads bytes as UTF-8 via `WebView.loadDataWithBaseURL(..., "text/html", "utf-8", ...)`
- JavaScript enabled for the document micro-runtime

## Icon

Launcher adaptive icons use the shared mark from [`apps/shared/branding/`](../shared/branding/).

## License

MIT — same as the [rdoc](https://github.com/DokaiiMob/rdoc) project.
