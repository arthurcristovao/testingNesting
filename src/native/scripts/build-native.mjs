import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

mkdirSync('build', { recursive: true });

const outputName = platform() === 'win32' ? 'build/packing_solver_bridge.exe' : 'build/packing_solver_bridge';
const sourceFile = 'src/native/bridge/packing_solver_bridge.cpp';

const compilerCandidates = platform() === 'win32'
  ? [
      { cmd: 'c++', args: ['-O2', '-std=c++17', sourceFile, '-o', outputName] },
      { cmd: 'g++', args: ['-O2', '-std=c++17', sourceFile, '-o', outputName] },
      { cmd: 'clang++', args: ['-O2', '-std=c++17', sourceFile, '-o', outputName] },
      { cmd: 'cl', args: ['/O2', '/std:c++17', '/EHsc', sourceFile, `/Fe:${outputName}`] },
    ]
  : [{ cmd: 'c++', args: ['-O2', '-std=c++17', sourceFile, '-o', outputName] }];

let foundCompiler = false;
let exitCode = 0;

for (const candidate of compilerCandidates) {
  const result = spawnSync(candidate.cmd, candidate.args, { stdio: 'inherit' });

  if (result.error?.code === 'ENOENT') {
    continue;
  }

  foundCompiler = true;
  exitCode = result.status ?? 1;
  break;
}

if (!foundCompiler) {
  if (platform() === 'win32') {
    console.error('No C++ compiler found in PATH. Install MSYS2/MinGW (g++, c++) or Visual Studio Build Tools (cl.exe).');
  } else {
    console.error('c++ not found. Install a C++ compiler (gcc/clang) and ensure it is in PATH.');
  }
  process.exit(1);
}

if (exitCode !== 0) {
  process.exit(exitCode);
}

console.log(`Native bridge built at ${outputName}`);
