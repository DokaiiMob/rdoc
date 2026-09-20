#!/usr/bin/env bash
# Convert any Pandoc-supported input → intermediate Markdown → full .rdoc polyglot.
#
# Usage:
#   ./pandoc/pandoc-rdoc.sh article.md -o article.rdoc.html
#   ./pandoc/pandoc-rdoc.sh paper.tex -o paper.rdoc.html -- -t gfm
#   ./pandoc/pandoc-rdoc.sh paper.tex -o paper.rdoc.html --title "My Paper" --author "Ada"
#
# Extra pandoc flags after -- are forwarded to pandoc.
# Extra rdoc flags: --title --author --lang --description (and -t/-a/-l/-d short forms).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILTER="$ROOT/pandoc/rdoc.lua"
CLI="$ROOT/dist/cli.js"

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

INPUT=""
OUTPUT="output.rdoc.html"
RDOC_OPTS=()
PANDOC_EXTRA=()
PASS_TO_PANDOC=0

while [[ $# -gt 0 ]]; do
  if [[ $PASS_TO_PANDOC -eq 1 ]]; then
    PANDOC_EXTRA+=("$1")
    shift
    continue
  fi
  case "$1" in
    -h|--help) usage 0 ;;
    -o|--output) OUTPUT="$2"; shift 2 ;;
    # Long options only for metadata (avoid clashing with pandoc -t/-f).
    --title) RDOC_OPTS+=(--title "$2"); shift 2 ;;
    --author) RDOC_OPTS+=(--author "$2"); shift 2 ;;
    --lang) RDOC_OPTS+=(--lang "$2"); shift 2 ;;
    --description) RDOC_OPTS+=(--description "$2"); shift 2 ;;
    --) PASS_TO_PANDOC=1; shift ;;
    -*)
      echo "Unknown option: $1 (pass pandoc flags after --)" >&2
      usage 1
      ;;
    *)
      if [[ -z "$INPUT" ]]; then INPUT="$1"; else
        echo "Unexpected argument: $1" >&2
        usage 1
      fi
      shift
      ;;
  esac
done

[[ -n "$INPUT" ]] || { echo "Input file required." >&2; usage 1; }
command -v pandoc >/dev/null || { echo "pandoc not found in PATH" >&2; exit 1; }
command -v node >/dev/null || { echo "node not found in PATH" >&2; exit 1; }
[[ -f "$CLI" ]] || { echo "Build CLI first: npm run build ($CLI missing)" >&2; exit 1; }
[[ -f "$FILTER" ]] || { echo "Missing filter: $FILTER" >&2; exit 1; }

TMP="$(mktemp "${TMPDIR:-/tmp}/rdoc-pandoc.XXXXXX.md")"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

# Step a: pandoc → intermediate GFM Markdown (RDOC-friendly AST via filter)
pandoc "$INPUT" -t gfm -L "$FILTER" -o "$TMP" "${PANDOC_EXTRA[@]}"

# Step b: rdoc build → final polyglot (CSP, manifest, hash, reader chrome)
node "$CLI" build "$TMP" -o "$OUTPUT" "${RDOC_OPTS[@]}"
]]
