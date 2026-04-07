#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:?usage: render-formula.sh <version> <asset-dir>}"
ASSET_DIR="${2:?usage: render-formula.sh <version> <asset-dir>}"
REPO="${REPO:-Holden-Lin/claudex-switch}"

if [ ! -d "$ASSET_DIR" ]; then
  printf 'Asset directory not found: %s\n' "$ASSET_DIR" >&2
  exit 1
fi

if [[ "$VERSION" == v* ]]; then
  VERSION_NO_PREFIX="${VERSION#v}"
  TAG_NAME="$VERSION"
else
  VERSION_NO_PREFIX="$VERSION"
  TAG_NAME="v$VERSION"
fi

asset_sha() {
  local file="$ASSET_DIR/$1"

  if [ ! -f "$file" ]; then
    printf 'Missing asset: %s\n' "$file" >&2
    exit 1
  fi

  shasum -a 256 "$file" | awk '{print $1}'
}

BASE_URL="https://github.com/${REPO}/releases/download/${TAG_NAME}"
DARWIN_ARM64_SHA="$(asset_sha claudex-switch-darwin-arm64.tar.gz)"
DARWIN_X64_SHA="$(asset_sha claudex-switch-darwin-x64.tar.gz)"
LINUX_ARM64_SHA="$(asset_sha claudex-switch-linux-arm64.tar.gz)"
LINUX_X64_SHA="$(asset_sha claudex-switch-linux-x64.tar.gz)"

cat <<EOF
class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/${REPO}"
  version "${VERSION_NO_PREFIX}"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "${BASE_URL}/claudex-switch-darwin-arm64.tar.gz"
      sha256 "${DARWIN_ARM64_SHA}"
    else
      url "${BASE_URL}/claudex-switch-darwin-x64.tar.gz"
      sha256 "${DARWIN_X64_SHA}"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "${BASE_URL}/claudex-switch-linux-arm64.tar.gz"
      sha256 "${LINUX_ARM64_SHA}"
    else
      url "${BASE_URL}/claudex-switch-linux-x64.tar.gz"
      sha256 "${LINUX_X64_SHA}"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
EOF
