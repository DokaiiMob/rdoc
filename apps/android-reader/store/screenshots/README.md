# Play Store screenshots (placeholders)

Add real device captures before submission. Keep filenames stable so CI/docs can reference them.

## Required / recommended sizes (phone)

| Slot | Suggested size | Placeholder file |
|------|----------------|------------------|
| Phone | **1080 × 1920** (or 1080 × 2340) | `phone-01-welcome.png` |
| Phone | same | `phone-02-open-doc.png` |
| Phone | same | `phone-03-recent.png` |
| 7" tablet (optional) | **1200 × 1920** | `tablet-7-01.png` |
| 10" tablet (optional) | **1600 × 2560** | `tablet-10-01.png` |

Google accepts a range of aspect ratios; prefer portrait phone shots with the system status bar optional.

## Shot list

1. **Welcome** — empty state explaining Open / Share / Always
2. **Document** — sample `.rdoc` rendered in the WebView (light or dark)
3. **Recent** — Recent dialog or menu with local entries
4. **Optional** — home-screen widget “Open last doc”

## Branding

Use icons/colors from [`../../shared/branding/`](../../shared/branding/). Feature graphic (1024 × 500) can be added later as `feature-graphic.png`.

## Note

Binary PNGs are intentionally omitted from the repo until captured on a real device/emulator. Drop files into this folder with the names above.
