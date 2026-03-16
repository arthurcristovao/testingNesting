#!/usr/bin/env bash
set -euo pipefail
if ! command -v em++ >/dev/null 2>&1; then
  echo "em++ not found. Install emsdk and activate it before running this script." >&2
  exit 1
fi
mkdir -p public/wasm
em++ src/native/bridge/packing_solver_bridge.cpp -O2 -std=c++17 \
  -sWASM=1 -sMODULARIZE=1 -sEXPORT_ES6=1 -sALLOW_MEMORY_GROWTH=1 \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -o public/wasm/packing_solver_bridge.js
printf 'WASM bridge built at public/wasm/packing_solver_bridge.js/.wasm\n'
