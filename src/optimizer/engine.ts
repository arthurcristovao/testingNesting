import { runSolver } from '../wasm/packingSolver';
import { evaluateSolution } from './evaluator';
import { SeededRandom } from './random';
import {
  OptimizationMode,
  OptimizationParams,
  OptimizationSolution,
  PieceInput,
  Sheet,
  SolverRequest
} from './types';

const STRATEGIES: SolverRequest['insertionStrategy'][] = ['first_fit', 'best_area_fit', 'shelf', 'max_contact'];

export async function optimizeCuttingPlan(
  pieces: PieceInput[],
  params: OptimizationParams,
  onProgress?: (solution: OptimizationSolution) => void
): Promise<OptimizationSolution> {
  const start = Date.now();
  const baseSeed = params.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = new SeededRandom(baseSeed);
  let iteration = 0;

  let currentSheets: Sheet[] = [{ id: 'sheet-1', width: 2750, height: 1850, material: pieces[0]?.material ?? 'MDF' }];
  let best = await runOneAttempt(pieces, params, baseSeed, currentSheets, params.mode);
  best.stats.iteration = iteration;
  best.stats.score = evaluateSolution(best);
  onProgress?.(best);

  while (iteration < params.maxIterations && Date.now() - start < params.maxTimeMs) {
    iteration++;
    const seed = rng.nextInt(1, 2 ** 31 - 1);
    const randomizedPieces = randomizePieces(pieces, new SeededRandom(seed));
    const candidate = await runOneAttempt(randomizedPieces, params, seed, currentSheets, params.mode);
    candidate.stats.iteration = iteration;
    candidate.stats.score = evaluateSolution(candidate);

    if (candidate.placements.length < randomizedPieces.reduce((acc, p) => acc + p.quantity, 0)) {
      currentSheets = [...currentSheets, { id: `sheet-${currentSheets.length + 1}`, width: 2750, height: 1850, material: pieces[0]?.material ?? 'MDF' }];
      continue;
    }

    if (candidate.stats.score < best.stats.score) {
      best = candidate;
      currentSheets = candidate.sheets;
      onProgress?.(best);
    }
  }

  return best;
}

async function runOneAttempt(
  pieces: PieceInput[],
  params: OptimizationParams,
  seed: number,
  sheets: Sheet[],
  mode: OptimizationMode
): Promise<OptimizationSolution> {
  const rng = new SeededRandom(seed);
  const req: SolverRequest = {
    pieces,
    sheets,
    params: {
      ...params,
      kerf: perturb(params.kerf, 0.25, rng),
      safetyMargin: perturb(params.safetyMargin, 0.3, rng)
    },
    randomSeed: seed,
    insertionStrategy: rng.pick(STRATEGIES)
  };

  switch (mode) {
    case 'guillotine_only':
      return runSolver(req, 'guillotine');
    case 'irregular_only':
      return runSolver(req, 'irregular');
    case 'hybrid_alternating':
      return runSolver(req, seed % 2 === 0 ? 'guillotine' : 'irregular');
    case 'hybrid_parallel': {
      const [a, b] = await Promise.all([runSolver(req, 'guillotine'), runSolver(req, 'irregular')]);
      return evaluateSolution(a) < evaluateSolution(b) ? a : b;
    }
  }
}

function perturb(value: number, maxDelta: number, rng: SeededRandom): number {
  const delta = (rng.next() - 0.5) * 2 * maxDelta;
  return Math.max(0, value + delta);
}

function randomizePieces(pieces: PieceInput[], rng: SeededRandom): PieceInput[] {
  return rng.shuffle(pieces).map((piece) => ({
    ...piece,
    canRotate: piece.canRotate ?? rng.next() > 0.25
  }));
}
