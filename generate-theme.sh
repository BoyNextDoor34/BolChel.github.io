#!/usr/bin/env bash
set -euo pipefail

# Generate a JSON Material You palette from a news image using Matugen.
# Example:
#   ./matugen/generate-theme.sh public/news-images/story-1.jpg public/themes/story-1.json

IMAGE="${1:?image path required}"
OUT="${2:?output json path required}"

if ! command -v matugen >/dev/null 2>&1; then
  echo "Matugen is not installed. See https://github.com/InioX/matugen" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
matugen image "$IMAGE" --source-color-index 0 --json hex > "$OUT"
echo "Wrote $OUT"
