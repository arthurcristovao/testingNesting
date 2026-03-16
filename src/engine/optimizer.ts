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
    const batchSize = Math.max(1, params.parallelWorkers);
    const offsets: number[] = [];
    for (let i = 0; i < batchSize && iteration < params.maxIterations; i += 1) {
      iteration += 1;
      offsets.push(iteration);
    }

    const candidates = await Promise.all(offsets.map((offset) => solver.solve(pieces, params, offset)));
    for (const candidate of candidates) {
      candidate.score = scoreSolution(candidate);
      if (candidate.score < best.score) {
        best = candidate;
        onProgress?.({ currentIteration: candidate.iteration, best });
      }
    }
  }

  return best;
}
