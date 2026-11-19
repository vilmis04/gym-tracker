#!/usr/bin/env bash
# Fails when source files contain raw color literals instead of design tokens
# (E02-T01; `npm run check:colors`, run in CI). Colors are defined once, in
# the token file <dir>/app/globals.css; everything else uses token utilities
# (`bg-primary`, `text-muted-foreground`) or `var(--token)`.
#
#   scripts/check-raw-colors.sh [dir]   # default: src
#
# Flags hex colors (#fff, #ff0000, #ff000080, also inside `bg-[#ff0000]`) and
# color functions (rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), oklab(),
# oklch()) in .ts/.tsx/.js/.jsx/.mjs/.cjs/.css files. A line that really needs
# one (e.g. a third-party value that can't use a token) can opt out with a
# comment containing `raw-color-allowed: <reason>`.
set -euo pipefail

root="${1:-src}"
root="${root%/}"
token_file="$root/app/globals.css"
allow_marker="raw-color-allowed"

# Hex colors of 3, 4, 6 or 8 digits not inside a word or an HTML entity
# (&#123;). Matches "#fff", "color: #ff0000", "bg-[#FAF7F2]"; not "#main", "&#123;".
hex_color='(^|[^&[:alnum:]_])#([[:xdigit:]]{3,4}|[[:xdigit:]]{6}|[[:xdigit:]]{8})([^[:alnum:]_-]|$)'
# CSS color functions. Matches "rgb(255 0 0)", "rgba(0,0,0,.5)", "oklch(0.7 0.1 120)";
# not "color-mix(" or "var(".
color_function='(^|[^[:alnum:]_-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\('

if [ ! -d "$root" ]; then
  echo "ERROR: $root is not a directory." >&2
  exit 2
fi

matches="$(
  grep -rnE "$hex_color|$color_function" "$root" \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    --include='*.mjs' --include='*.cjs' --include='*.css' |
    grep -v "^$token_file:" |
    grep -v "$allow_marker" || true
)"

if [ -z "$matches" ]; then
  echo "No raw colors outside $token_file."
  exit 0
fi

while IFS= read -r match; do
  file="${match%%:*}"
  rest="${match#*:}"
  line="${rest%%:*}"
  message="Raw color literal; use a design token instead (docs/design-system.md → Color tokens)."
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "::error file=$file,line=$line::$message"
  fi
  echo "$file:$line: ${rest#*:}"
done <<<"$matches"

echo "ERROR: raw colors found outside $token_file. Use token utilities (bg-primary, text-muted-foreground, …) or var(--token); add new colors as tokens in $token_file." >&2
exit 1
