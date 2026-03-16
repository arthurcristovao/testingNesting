import {
  GuillotineCut,
  OptimizationParams,
  OptimizationSolution,
  PieceInput,
  PiecePlacement,
  Sheet,
  SolverRequest
} from '../optimizer/types';
import { evaluateSolution } from '../optimizer/evaluator';

interface WasmExports {
  solve_guillotine?: (inputPtr: number, len: number) => number;
  solve_irregular?: (inputPtr: number, len: number) => number;
}

let wasmModule: WasmExports | null = null;

export async function initPackingSolverWasm(): Promise<void> {
  if (wasmModule) return;
  wasmModule = {};
}

export async function runSolver(request: SolverRequest, mode: 'guillotine' | 'irregular'): Promise<OptimizationSolution> {
  // Placeholder: structure ready to swap to actual WASM bindings from PackingSolver.
  return mode === 'guillotine'
    ? heuristicGuillotine(request)
    : heuristicIrregular(request);
}

function heuristicGuillotine(request: SolverRequest): OptimizationSolution {
  const expanded = expandPieces(request.pieces);
  const placements: PiecePlacement[] = [];
  const cuts: GuillotineCut[] = [];
  const sheets = [...request.sheets];

  let cursorSheet = 0;
  let cursorX = request.params.edgeTrim;
  let cursorY = request.params.edgeTrim;
  let rowHeight = 0;

  for (const piece of expanded) {
    const canRotate = piece.canRotate ?? true;
    const w0 = piece.width + request.params.kerf;
    const h0 = piece.height + request.params.kerf;
    const rotate = canRotate && request.randomSeed % 2 === 0 && h0 > w0;
    const width = rotate ? h0 : w0;
    const height = rotate ? w0 : h0;

    while (true) {
      const sheet = sheets[cursorSheet] ?? createNewSheet(cursorSheet, request.pieces[0]?.material ?? 'MDF');
      if (!sheets[cursorSheet]) sheets.push(sheet);
      const usableW = sheet.width - request.params.edgeTrim - request.params.safetyMargin;
      const usableH = sheet.height - request.params.edgeTrim - request.params.safetyMargin;

      if (cursorX + width <= usableW && cursorY + height <= usableH) {
        placements.push({
          pieceId: piece.id,
          instanceId: piece.instanceId,
          sheetId: sheet.id,
          x: cursorX,
          y: cursorY,
          width,
          height,
          rotation: rotate ? 90 : 0,
          modeUsed: 'guillotine'
        });

        cuts.push({ sheetId: sheet.id, direction: 'V', at: cursorX + width, depth: 1 });
        cursorX += width;
        rowHeight = Math.max(rowHeight, height);
        break;
      }

      cursorX = request.params.edgeTrim;
      cursorY += rowHeight;
      rowHeight = 0;
      if (cursorY + height > usableH) {
        cursorSheet++;
        cursorX = request.params.edgeTrim;
        cursorY = request.params.edgeTrim;
      }
    }
  }

  const stats = calculateStats(sheets, placements, cuts, request.params, request.randomSeed);
  const solution: OptimizationSolution = { sheets, placements, guillotineCuts: cuts, stats };
  solution.stats.score = evaluateSolution(solution);
  return solution;
}

function heuristicIrregular(request: SolverRequest): OptimizationSolution {
  // Approximate irregular mode using bounding boxes and compact placement strategy.
  const expanded = expandPieces(request.pieces).sort((a, b) => b.width * b.height - a.width * a.height);
  const placements: PiecePlacement[] = [];
  const sheets = [...request.sheets];
  const skylineBySheet: Record<string, number[]> = {};

  for (const piece of expanded) {
    let placed = false;
    for (const sheet of sheets) {
      if (!skylineBySheet[sheet.id]) skylineBySheet[sheet.id] = new Array(20).fill(request.params.edgeTrim);
      const skyline = skylineBySheet[sheet.id];
      const colW = Math.floor((sheet.width - request.params.edgeTrim * 2) / skyline.length);
      const neededCols = Math.max(1, Math.ceil((piece.width + request.params.kerf) / colW));

      for (let i = 0; i <= skyline.length - neededCols; i++) {
        const y = Math.max(...skyline.slice(i, i + neededCols));
        const h = piece.height + request.params.kerf;
        if (y + h <= sheet.height - request.params.edgeTrim - request.params.safetyMargin) {
          const x = request.params.edgeTrim + i * colW;
          placements.push({
            pieceId: piece.id,
            instanceId: piece.instanceId,
            sheetId: sheet.id,
            x,
            y,
            width: piece.width + request.params.kerf,
            height: h,
            rotation: 0,
            modeUsed: 'irregular'
          });
          for (let c = i; c < i + neededCols; c++) skyline[c] = y + h;
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      const newSheet = createNewSheet(sheets.length, piece.material);
      sheets.push(newSheet);
      skylineBySheet[newSheet.id] = new Array(20).fill(request.params.edgeTrim);
      placements.push({
        pieceId: piece.id,
        instanceId: piece.instanceId,
        sheetId: newSheet.id,
        x: request.params.edgeTrim,
        y: request.params.edgeTrim,
        width: piece.width + request.params.kerf,
        height: piece.height + request.params.kerf,
        rotation: 0,
        modeUsed: 'irregular'
      });
    }
  }

  const stats = calculateStats(sheets, placements, [], request.params, request.randomSeed);
  const solution: OptimizationSolution = { sheets, placements, guillotineCuts: [], stats };
  solution.stats.score = evaluateSolution(solution);
  return solution;
}

function expandPieces(pieces: PieceInput[]) {
  return pieces.flatMap((p) =>
    Array.from({ length: p.quantity }, (_, i) => ({ ...p, instanceId: `${p.id}-${i + 1}` }))
  );
}

function calculateStats(
  sheets: Sheet[],
  placements: PiecePlacement[],
  cuts: GuillotineCut[],
  params: OptimizationParams,
  seed: number
) {
  const usedSheetIds = new Set(placements.map((p) => p.sheetId));
  const usedSheets = usedSheetIds.size;
  const totalArea = sheets
    .filter((s) => usedSheetIds.has(s.id))
    .reduce((sum, s) => sum + (s.width - 2 * params.edgeTrim) * (s.height - 2 * params.edgeTrim), 0);
  const utilizedArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);
  return {
    wasteArea: Math.max(0, totalArea - utilizedArea),
    utilizedArea,
    totalArea,
    usedSheets,
    totalCuts: cuts.length,
    score: 0,
    iteration: 0,
    seed
  };
}

function createNewSheet(index: number, material: string): Sheet {
  return { id: `sheet-${index + 1}`, width: 2750, height: 1850, material };
}
