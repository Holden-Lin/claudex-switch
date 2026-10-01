#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="${1:-release}"

for license_file in LICENSE COMMERCIAL-LICENSING.md; do
  if [ ! -s "$license_file" ]; then
    printf 'Missing required release notice: %s\n' "$license_file" >&2
    exit 1
  fi
done

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
: > "$OUTPUT_DIR/checksums.txt"
cp LICENSE COMMERCIAL-LICENSING.md "$OUTPUT_DIR/"

targets=(
  "bun-darwin-arm64 darwin arm64"
  "bun-darwin-x64 darwin x64"
  "bun-linux-arm64 linux arm64"
  "bun-linux-x64 linux x64"
)

for target in "${targets[@]}"; do
  read -r bun_target os arch <<<"$target"

  asset_name="claudex-switch-${os}-${arch}"
  work_dir="$OUTPUT_DIR/$asset_name"
  archive_path="$OUTPUT_DIR/${asset_name}.tar.gz"

  mkdir -p "$work_dir"

  bun build ./src/index.ts --compile --target="$bun_target" --outfile="$work_dir/claudex-switch"
  cp LICENSE COMMERCIAL-LICENSING.md "$work_dir/"
  tar -C "$work_dir" -czf "$archive_path" claudex-switch LICENSE COMMERCIAL-LICENSING.md
  shasum -a 256 "$archive_path" >> "$OUTPUT_DIR/checksums.txt"

  rm -rf "$work_dir"
done
