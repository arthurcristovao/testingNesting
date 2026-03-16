import type { CuttingParams, OptimizationSolution, PieceRequest } from '../types';
import { scoreSolution } from './cost';
import { loadPackingSolverWasm } from '../wasm/packingSolverWasm';

export interface OptimizationProgress {
  currentIteration: number;
  best: OptimizationSolution;
}

export async function optimizeCuttingPlan(
  pieces: PieceRequest[],
  params: CuttingParams,
  onProgress?: (progress: OptimizationProgress) => void,
): Promise<OptimizationSolution> {
  const solver = await loadPackingSolverWasm();
  const startedAt = performance.now();
  let iteration = 0;

  let best = await solver.solve(pieces, params, iteration);
  best.score = scoreSolution(best);
  onProgress?.({ currentIteration: iteration, best });

  while (iteration < params.maxIterations && performance.now() - startedAt < params.maxTimeMs) {
    iteration += 1;

    const candidate = await solver.solve(pieces, params, iteration);
    candidate.score = scoreSolution(candidate);

    if (candidate.score < best.score) {
      best = candidate;
      onProgress?.({ currentIteration: iteration, best });
    }
  }

  return best;
}
