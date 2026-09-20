#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLI="$ROOT/dist/cli.js"
NODE="$(command -v node)"
test -f "$CLI" || { echo "Build first: npm run build"; exit 1; }

BIN="${HOME}/.local/bin"
mkdir -p "$BIN"
WRAPPER="$BIN/rdoc-open"
cat > "$WRAPPER" <<EOF
#!/bin/bash
exec "$NODE" "$CLI" open "\$@"
EOF
chmod +x "$WRAPPER"
echo "Installed $WRAPPER"
echo "Assign it as the default app for .rdoc via Finder → Get Info → Open with."
if command -v duti >/dev/null 2>&1; then
  echo "Tip: duti can set handlers; still prefer opening via $WRAPPER for HTML semantics."
fi
