# Privacy Policy (draft) — rdoc Reader (Android)

**Status:** Draft for Play Store listing. Host a stable HTTPS URL before production release and replace this note with the published URL.

**Last updated:** 2026-03-29  
**App:** rdoc Reader (`com.rdoc.reader`)  
**Contact:** project maintainers via [github.com/DokaiiMob/rdoc](https://github.com/DokaiiMob/rdoc)

## Summary

rdoc Reader is a local document viewer. **Reading a `.rdoc` file does not require network access.** Files you open are processed on your device.

## Data we process on-device

| Data | Purpose | Leaves device? |
|------|---------|----------------|
| Document URI / path you open | Load and display the file | No |
| Document bytes (HTML) | Render in WebView | No |
| Recent-file list (URI + title) | “Recent” menu and optional widget | No (SharedPreferences) |
| Persistable SAF grants | Re-open files from Downloads / Drive without re-picking | No (system URI permissions) |

We do **not** require an account. We do **not** sell personal data.

## Network

- **Not required for reading.** Opening and displaying a document works offline once the file is available on the device or via a granted content URI.
- The app does not include analytics SDKs in the current build.
- If a future optional feature (for example, checking for updates) uses the network, it will be clearly optional and documented in an updated policy.

## Permissions

- **Storage Access Framework / content URIs:** you grant read access to specific files (and optionally persist that grant). The app does not request broad “all files” storage access for normal reading.
- **Internet:** not declared for core reading. If the Android package later declares `INTERNET` for an optional feature, that will be reflected here and in Play Data safety.

## WebView

Documents may include their own scripts (the rdoc micro-runtime). Content is loaded from the file you opened. Treat untrusted `.rdoc` files like untrusted HTML.

## Children

The app is a general-purpose document reader, not directed at children under 13. No age-gated social features are included.

## Changes

Material changes to this policy will be reflected in the Play Store listing and this file in the repository.

## Your choices

- Clear **Recent** from the app menu.
- Revoke persisted file access in system Settings → Apps → rdoc Reader → permissions / storage access (wording varies by OEM).
- Uninstall the app to remove local preferences.
