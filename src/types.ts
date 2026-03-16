export type PieceShape =
  | {
      kind: 'rectangle';
      width: number;
      height: number;
    }
  | {
      kind: 'polygon';
      points: Array<{ x: number; y: number }>;
      boundingWidth: number;
      boundingHeight: number;
    };

export interface PieceRequest {
  id: string;
  label: string;
  quantity: number;
  material: string;
  rotatable: boolean;
  shape: PieceShape;
}

export interface CuttingParams {
  kerf: number;
  trim: number;
  safetyMargin: number;
  maxIterations: number;
  maxTimeMs: number;
  seed: number;
  mode: 'guillotine' | 'irregular' | 'hybrid' | 'auto';
  parallelWorkers: number;
}

export interface Sheet {
  id: string;
  material: string;
  width: number;
  height: number;
}

export interface Placement {
  pieceId: string;
  label: string;
  sheetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
  modeUsed: 'guillotine' | 'irregular';
}

export interface GuillotineCut {
  sheetId: string;
  orientation: 'horizontal' | 'vertical';
  at: number;
  depth: number;
}

export interface SolutionMetrics {
  usedSheets: number;
  wasteArea: number;
  usedArea: number;
  utilizationRate: number;
  totalCuts: number;
  totalPiecesPlaced: number;
}

export interface OptimizationSolution {
  placements: Placement[];
  sheets: Sheet[];
  guillotineCuts: GuillotineCut[];
  metrics: SolutionMetrics;
  iteration: number;
  score: number;
  seed: number;
}

export interface PieceGenerationConfig {
  totalPieces: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  irregularRatio: number;
  rotatableRatio: number;
  material: string;
}
