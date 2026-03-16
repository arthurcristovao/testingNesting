#!/usr/bin/env bash
set -euo pipefail

# Exemplo: requer emsdk ativo e fontes do PackingSolver disponíveis.
em++ packing_solver_bindings.cpp \
  -O3 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=PackingSolverModule \
  -s ENVIRONMENT='web,node' \
  --bind \
  -o ../public/packingsolver.js
