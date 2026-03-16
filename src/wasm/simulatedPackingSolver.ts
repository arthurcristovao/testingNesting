import type {
  CuttingParams,
  GuillotineCut,
  OptimizationSolution,
  PieceRequest,
  Placement,
  Sheet,
} from '../types';
import { scoreSolution } from '../engine/cost';
import { SeededRandom } from '../engine/random';

const SHEET_WIDTH = 2750;
const SHEET_HEIGHT = 1850;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExpandedPiece {
  pieceId: string;
  label: string;
  material: string;
  width: number;
  height: number;
  rotatable: boolean;
  isIrregular: boolean;
}

function areaOfPiece(piece: PieceRequest) {
  if (piece.shape.kind === 'rectangle') {
    return piece.shape.width * piece.shape.height;
  }
  const points = piece.shape.points;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area / 2);
}

function expandPieces(pieces: PieceRequest[]) {
  const expanded: ExpandedPiece[] = [];
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i += 1) {
      if (piece.shape.kind === 'rectangle') {
        expanded.push({
          pieceId: `${piece.id}#${i + 1}`,
          label: piece.label,
          material: piece.material,
          width: piece.shape.width,
          height: piece.shape.height,
          rotatable: piece.rotatable,
          isIrregular: false,
        });
      } else {
        expanded.push({
          pieceId: `${piece.id}#${i + 1}`,
          label: piece.label,
          material: piece.material,
          width: piece.shape.boundingWidth,
          height: piece.shape.boundingHeight,
          rotatable: piece.rotatable,
          isIrregular: true,
        });
      }
    }
  }
  return expanded;
}

function pieceRect(piece: ExpandedPiece, rotate: boolean, margin: number, kerf: number) {
  const w = rotate ? piece.height : piece.width;
  const h = rotate ? piece.width : piece.height;
  return { width: w + margin * 2 + kerf, height: h + margin * 2 + kerf };
}

function findFit(freeRects: Rect[], width: number, height: number) {
  let bestIdx = -1;
  let bestWaste = Number.POSITIVE_INFINITY;
  for (let i = 0; i < freeRects.length; i += 1) {
    const r = freeRects[i];
    if (width <= r.width && height <= r.height) {
      const waste = r.width * r.height - width * height;
      if (waste < bestWaste) {
        bestWaste = waste;
        bestIdx = i;
      }
    }
  }
  return bestIdx;
}

function splitFreeRect(rect: Rect, used: Rect, guillotine: boolean): Rect[] {
  if (guillotine) {
    return [
      {
        x: rect.x + used.width,
        y: rect.y,
        width: rect.width - used.width,
        height: used.height,
      },
      {
        x: rect.x,
        y: rect.y + used.height,
        width: rect.width,
        height: rect.height - used.height,
      },
    ].filter((r) => r.width > 0 && r.height > 0);
  }

  return [
    {
      x: rect.x + used.width,
      y: rect.y,
      width: rect.width - used.width,
      height: rect.height,
    },
    {
      x: rect.x,
      y: rect.y + used.height,
      width: used.width,
      height: rect.height - used.height,
    },
  ].filter((r) => r.width > 0 && r.height > 0);
}

function makeSheet(material: string, idx: number): Sheet {
  return {
    id: `${material}-sheet-${idx}`,
    material,
    width: SHEET_WIDTH,
    height: SHEET_HEIGHT,
  };
}

export async function solveHeuristicPacking(
  pieces: PieceRequest[],
  params: CuttingParams,
  seedOffset: number,
): Promise<OptimizationSolution> {
  const random = new SeededRandom(params.seed + seedOffset);
  const expanded = random.shuffle(expandPieces(pieces));
  const preferredMode: 'guillotine' | 'irregular' | 'hybrid' =
    params.mode === 'auto'
      ? random.pick(['guillotine', 'irregular', 'hybrid'] as const)
      : params.mode === 'hybrid'
        ? 'hybrid'
        : params.mode;

  const placements: Placement[] = [];
  const cuts: GuillotineCut[] = [];
  const sheets: Sheet[] = [];
  const freeBySheet = new Map<string, Rect[]>();

  const addSheet = (material: string) => {
    const next = makeSheet(material, sheets.length + 1);
    sheets.push(next);
    freeBySheet.set(next.id, [
      {
        x: params.trim,
        y: params.trim,
        width: next.width - params.trim * 2,
        height: next.height - params.trim * 2,
      },
    ]);
    return next;
  };

  for (const piece of expanded) {
    const modeUsed =
      preferredMode === 'hybrid'
        ? piece.isIrregular
          ? 'irregular'
          : random.pick(['guillotine', 'irregular'])
        : preferredMode;

    const shouldRotate = piece.rotatable ? random.next() > 0.5 : false;
    const rect = pieceRect(piece, shouldRotate, params.safetyMargin, params.kerf);

    const candidateSheets = sheets.filter((s) => s.material === piece.material);
    let placed = false;

    for (const sheet of candidateSheets) {
      const freeRects = freeBySheet.get(sheet.id) ?? [];
      const fitIndex = findFit(freeRects, rect.width, rect.height);
      if (fitIndex >= 0) {
        const target = freeRects[fitIndex];
        const placementRect = {
          x: target.x,
          y: target.y,
          width: rect.width,
          height: rect.height,
        };

        placements.push({
          pieceId: piece.pieceId,
          label: piece.label,
          sheetId: sheet.id,
          x: placementRect.x,
          y: placementRect.y,
          width: rect.width,
          height: rect.height,
          rotation: shouldRotate ? 90 : 0,
          modeUsed,
        });

        const remaining = splitFreeRect(target, placementRect, modeUsed === 'guillotine');
        freeRects.splice(fitIndex, 1, ...remaining);
        freeBySheet.set(sheet.id, freeRects);

        if (modeUsed === 'guillotine') {
          cuts.push({
            sheetId: sheet.id,
            orientation: random.pick(['horizontal', 'vertical'] as const),
            at: random.int(1, Math.max(1, Math.floor(SHEET_WIDTH / 2))),
            depth: random.int(1, 4),
          });
        }

        placed = true;
        break;
      }
    }

    if (!placed) {
      const sheet = addSheet(piece.material);
      const freeRects = freeBySheet.get(sheet.id) ?? [];
      const fitIndex = findFit(freeRects, rect.width, rect.height);
      if (fitIndex < 0) {
        continue;
      }
      const target = freeRects[fitIndex];
      const placementRect = {
        x: target.x,
        y: target.y,
        width: rect.width,
        height: rect.height,
      };

      placements.push({
        pieceId: piece.pieceId,
        label: piece.label,
        sheetId: sheet.id,
        x: placementRect.x,
        y: placementRect.y,
        width: rect.width,
        height: rect.height,
        rotation: shouldRotate ? 90 : 0,
        modeUsed,
      });

      const remaining = splitFreeRect(target, placementRect, modeUsed === 'guillotine');
      freeRects.splice(fitIndex, 1, ...remaining);
      freeBySheet.set(sheet.id, freeRects);
    }
  }

  const usedArea = placements.reduce((acc, p) => acc + p.width * p.height, 0);
  const availableArea = sheets.length * SHEET_WIDTH * SHEET_HEIGHT;
  const requestedArea = pieces.reduce((acc, p) => acc + areaOfPiece(p) * p.quantity, 0);
  const wasteArea = Math.max(0, availableArea - requestedArea);

  const solution: OptimizationSolution = {
    placements,
    sheets,
    guillotineCuts: cuts,
    metrics: {
      usedSheets: sheets.length,
      wasteArea,
      usedArea,
      utilizationRate: availableArea > 0 ? usedArea / availableArea : 0,
      totalCuts: cuts.length,
    },
    iteration: seedOffset,
    score: 0,
    seed: params.seed + seedOffset,
  };

  solution.score = scoreSolution(solution);
  return solution;
}
