import { OptimizationSolution } from './types';

const SHEET_WEIGHT = 1_000_000;
const WASTE_WEIGHT = 1;
const CUT_WEIGHT = 50;

export function evaluateSolution(solution: OptimizationSolution): number {
  const { usedSheets, wasteArea, totalCuts } = solution.stats;
  return usedSheets * SHEET_WEIGHT + wasteArea * WASTE_WEIGHT + totalCuts * CUT_WEIGHT;
}
