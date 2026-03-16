import type { OptimizationSolution } from '../types';

export function scoreSolution(solution: OptimizationSolution): number {
  const { usedSheets, wasteArea, totalCuts } = solution.metrics;
  return usedSheets * 1_000_000 + wasteArea * 10 + totalCuts * 5;
}
