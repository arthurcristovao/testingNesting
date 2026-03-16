#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="packingsolver_upstream_c"
TMP_DIR="$(mktemp -d)"
REPO_URL="https://github.com/fontanf/packingsolver.git"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

printf 'Baixando packingsolver (sparse checkout do diretório src) ...\n'

git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$TMP_DIR/repo"
cd "$TMP_DIR/repo"
git sparse-checkout set src

rm -rf "$OLDPWD/$TARGET_DIR"
mkdir -p "$OLDPWD/$TARGET_DIR"
cp -R src/. "$OLDPWD/$TARGET_DIR/"

printf 'Conteúdo de src copiado para %s\n' "$TARGET_DIR"
