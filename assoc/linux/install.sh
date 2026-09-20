#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLI="$ROOT/dist/cli.js"
NODE="$(command -v node)"
test -f "$CLI" || { echo "Build first: npm run build"; exit 1; }

MIME_DIR="${HOME}/.local/share/mime/packages"
APP_DIR="${HOME}/.local/share/applications"
mkdir -p "$MIME_DIR" "$APP_DIR"
cp "$(dirname "$0")/rdoc-mime.xml" "$MIME_DIR/rdoc.xml"

cat > "$APP_DIR/rdoc.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=RDOC Viewer
Comment=Open Responsive Document in the default browser
Exec=$NODE $CLI open %f
MimeType=application/vnd.rdoc+html;
NoDisplay=true
Terminal=false
Categories=Office;Viewer;
EOF
chmod +x "$APP_DIR/rdoc.desktop"

update-mime-database "${HOME}/.local/share/mime" 2>/dev/null || true
update-desktop-database "$APP_DIR" 2>/dev/null || true
xdg-mime default rdoc.desktop application/vnd.rdoc+html 2>/dev/null || true
echo "Installed MIME + rdoc.desktop"
