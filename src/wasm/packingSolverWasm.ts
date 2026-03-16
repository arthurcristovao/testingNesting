import type { CuttingParams, OptimizationSolution, PieceRequest } from '../types';
import { solveHeuristicPacking } from './simulatedPackingSolver';

export interface PackingSolverWasm {
  solve(
    pieces: PieceRequest[],
    params: CuttingParams,
    seedOffset: number,
  ): Promise<OptimizationSolution>;
}

async function tryLoadCompiledModule() {
  try {
    const bridgeUrl = '/wasm/packing_solver_bridge.js';
    const mod = await import(/* @vite-ignore */ bridgeUrl);
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

export async function loadPackingSolverWasm(): Promise<PackingSolverWasm> {
  const compiled = await tryLoadCompiledModule();

  return {
    async solve(pieces, params, seedOffset) {
      if (!compiled) {
        return solveHeuristicPacking(pieces, params, seedOffset);
      }

      // Hook para integração real com PackingSolver compilado.
      // Enquanto não houver o binário wasm no ambiente, usa fallback heurístico.
      return solveHeuristicPacking(pieces, params, seedOffset);
    },
  };
}
