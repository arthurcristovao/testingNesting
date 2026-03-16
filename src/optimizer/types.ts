export type ShapeType = 'rect' | 'polygon';

export interface PieceInput {
  id: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
  shapeType: ShapeType;
  polygon?: Array<[number, number]>;
  canRotate?: boolean;
}

export interface OptimizationParams {
  kerf: number;
  edgeTrim: number;
  safetyMargin: number;
  maxIterations: number;
  maxTimeMs: number;
  seed?: number;
  mode: OptimizationMode;
}

export interface Sheet {
  id: string;
  width: number;
  height: number;
  material: string;
}

export interface PiecePlacement {
  pieceId: string;
  instanceId: string;
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
  direction: 'H' | 'V';
  at: number;
  depth: number;
}

export interface OptimizationStats {
  wasteArea: number;
  utilizedArea: number;
  totalArea: number;
  usedSheets: number;
  totalCuts: number;
  score: number;
  iteration: number;
  seed: number;
}

export interface OptimizationSolution {
  sheets: Sheet[];
  placements: PiecePlacement[];
  guillotineCuts: GuillotineCut[];
  stats: OptimizationStats;
}

export type OptimizationMode =
  | 'guillotine_only'
  | 'irregular_only'
  | 'hybrid_alternating'
  | 'hybrid_parallel';

export interface SolverRequest {
  pieces: PieceInput[];
  sheets: Sheet[];
  params: OptimizationParams;
  randomSeed: number;
  insertionStrategy: 'first_fit' | 'best_area_fit' | 'shelf' | 'max_contact';
}
