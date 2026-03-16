import type { CuttingParams, OptimizationSolution, PieceRequest } from '../types';
import { solveHeuristicPacking } from './simulatedPackingSolver';

export interface PackingSolverWasm {
  solve(
    pieces: PieceRequest[],
    params: CuttingParams,
    seedOffset: number,
  ): Promise<OptimizationSolution>;
}

export async function loadPackingSolverWasm(): Promise<PackingSolverWasm> {
  // Estrutura compatível com módulo C++ compilado para WebAssembly (Emscripten).
  // Em produção, substituir por import dinâmico do artefato real do PackingSolver.
  return {
    async solve(pieces, params, seedOffset) {
      return solveHeuristicPacking(pieces, params, seedOffset);
    },
  };
}
