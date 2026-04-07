#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-Holden-Lin/claudex-switch}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
INSTALL_REF="${INSTALL_REF:-}"
VERSION="${VERSION:-}"
BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"

say() {
  printf '==> %s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

normalize_version() {
  case "$1" in
    v*) printf '%s\n' "$1" ;;
    *) printf 'v%s\n' "$1" ;;
  esac
}

fetch_latest_tag() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' \
    | head -n 1
}

resolve_ref() {
  if [ -n "$INSTALL_REF" ]; then
    printf '%s\n' "$INSTALL_REF"
    return
  fi

  if [ -n "$VERSION" ]; then
    normalize_version "$VERSION"
    return
  fi

  local latest_tag
  latest_tag="$(fetch_latest_tag || true)"
  if [ -n "$latest_tag" ]; then
    printf '%s\n' "$latest_tag"
    return
  fi

  printf '%s\n' "$DEFAULT_BRANCH"
}

ensure_bun() {
  if command -v bun >/dev/null 2>&1; then
    return
  fi

  say "Installing Bun"
  curl -fsSL https://bun.sh/install | bash
}

ensure_bun_on_path() {
  export PATH="$BUN_INSTALL/bin:$PATH"

  if ! command -v bun >/dev/null 2>&1; then
    fail "Bun installation completed but bun is not on PATH"
  fi
}

main() {
  local ref spec
  ref="$(resolve_ref)"
  spec="git+https://github.com/${REPO}.git#${ref}"

  ensure_bun
  ensure_bun_on_path

  say "Installing claudex-switch from ${ref}"
  bun install -g "$spec"

  if ! command -v claudex-switch >/dev/null 2>&1; then
    fail "claudex-switch was not added to PATH"
  fi

  claudex-switch help >/dev/null
  say "Installed claudex-switch at $(command -v claudex-switch)"
}

main "$@"
