# Play Store release (signed APK + AAB)

Local default remains **unsigned debug**. Do not invent or commit a real keystore.

## 1. Create a release keystore (once)

```powershell
cd apps\android-reader
keytool -genkeypair -v -keystore release.keystore -alias rdoc `
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep `release.keystore` offline / in a secrets store. Never commit it.

## 2. Configure signing

**Option A — properties file**

```powershell
copy keystore.properties.example keystore.properties
# Edit keystore.properties: storeFile, passwords, keyAlias
```

`storeFile` is resolved relative to `apps/android-reader/` (project root).

**Option B — environment variables** (good for CI)

| Variable | Meaning |
|----------|---------|
| `RDOC_KEYSTORE_FILE` | Absolute path to `.jks` / `.keystore` |
| `RDOC_KEYSTORE_PASSWORD` | Keystore password |
| `RDOC_KEY_ALIAS` | Key alias |
| `RDOC_KEY_PASSWORD` | Key password |

If neither file nor env is set, `assembleRelease` / `bundleRelease` still build, but the artifacts are **unsigned** (fine for smoke tests; not for Play upload).

## 3. Build

```powershell
cd apps\android-reader

# Debug (default local workflow)
.\gradlew.bat assembleDebug

# Release APK
.\gradlew.bat assembleRelease

# Play Store Android App Bundle
.\gradlew.bat bundleRelease
```

Outputs:

| Artifact | Path |
|----------|------|
| Debug APK | `app\build\outputs\apk\debug\app-debug.apk` |
| Release APK | `app\build\outputs\apk\release\app-release.apk` (or `app-release-unsigned.apk`) |
| Release AAB | `app\build\outputs\bundle\release\app-release.aab` |

## 4. Upload to Play Console

1. Create the app listing (see [`../store/`](../store/) for copy, privacy draft, rating notes, screenshot sizes).
2. Internal testing → upload the **AAB**.
3. Complete content rating, privacy policy URL, Data safety (local-only / no required network for reading).
4. Promote through closed → production when ready.

## 5. Secrets checklist

- [ ] `keystore.properties` gitignored
- [ ] `*.jks` / `*.keystore` gitignored
- [ ] CI secrets use env vars above (or encrypted file), not plaintext in YAML
- [ ] Play Console upload key / app signing enrolled as required by Google

## Versioning

Bump `versionCode` / `versionName` in `app/build.gradle` before each Play upload.
