import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('public/wasm', { recursive: true });

const args = [
  'src/native/bridge/packing_solver_bridge.cpp',
  '-O2',
  '-std=c++17',
  '-sWASM=1',
  '-sMODULARIZE=1',
  '-sEXPORT_ES6=1',
  '-sALLOW_MEMORY_GROWTH=1',
  '-sEXPORTED_RUNTIME_METHODS=["ccall","cwrap"]',
  '-o',
  'public/wasm/packing_solver_bridge.js',
];

const result = spawnSync('em++', args, { stdio: 'inherit' });

if (result.error?.code === 'ENOENT') {
  console.error('em++ not found. Install emsdk and activate it before running this script.');
  process.exit(1);
}

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status);
}

console.log('WASM bridge built at public/wasm/packing_solver_bridge.js/.wasm');
