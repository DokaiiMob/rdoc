# Homebrew Cask stub for rdoc Reader (macOS)
# Not yet submitted upstream — fill version / url / sha256 from a real GitHub
# Release zip (or dmg) produced by electron-builder.
#
# Expected asset names (from apps/desktop-reader electron-builder config):
#   rdoc-reader-<version>-mac-x64.zip
#   rdoc-reader-<version>-mac-arm64.zip
#   rdoc-reader-<version>-mac-x64.dmg
#   rdoc-reader-<version>-mac-arm64.dmg
#
# Local tap sketch:
#   brew install --cask ./packaging/homebrew/rdoc-reader.rb
#
# Placeholders below use 0.3.0 — replace after cutting a macOS reader release.
# Code signing / notarization are NOT required for this stub; Gatekeeper may
# warn on unsigned apps (System Settings → Privacy & Security → Open Anyway).

cask "rdoc-reader" do
  version "0.3.0"

  on_arm do
    # REPLACE_WITH_ARM64_ZIP_OR_DMG_SHA256
    sha256 "0000000000000000000000000000000000000000000000000000000000000000"
    url "https://github.com/DokaiiMob/rdoc/releases/download/v#{version}/rdoc-reader-#{version}-mac-arm64.zip"
  end
  on_intel do
    # REPLACE_WITH_X64_ZIP_OR_DMG_SHA256
    sha256 "0000000000000000000000000000000000000000000000000000000000000000"
    url "https://github.com/DokaiiMob/rdoc/releases/download/v#{version}/rdoc-reader-#{version}-mac-x64.zip"
  end

  name "rdoc Reader"
  desc "Desktop reader for bare .rdoc offline documents"
  homepage "https://github.com/DokaiiMob/rdoc"

  # Adjust if the zip nests the .app differently after electron-builder.
  app "rdoc Reader.app"

  zap trash: [
    "~/Library/Application Support/rdoc-desktop-reader",
    "~/Library/Preferences/com.rdoc.desktop-reader.plist",
    "~/Library/Saved Application State/com.rdoc.desktop-reader.savedState",
  ]
end
