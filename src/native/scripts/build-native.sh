#!/usr/bin/env bash
set -euo pipefail
mkdir -p build
c++ -O2 -std=c++17 src/native/bridge/packing_solver_bridge.cpp -o build/packing_solver_bridge
printf 'Native bridge built at build/packing_solver_bridge\n'
