import { describe, expect, it } from 'vitest';
import { optimizeCuttingPlan } from '../optimizer/engine';
import { PieceInput } from '../optimizer/types';

describe('optimizeCuttingPlan', () => {
  it('retorna solução com estatísticas válidas', async () => {
    const pieces: PieceInput[] = [
      { id: 'A', width: 400, height: 300, quantity: 8, material: 'MDF', shapeType: 'rect', canRotate: true },
      { id: 'B', width: 500, height: 250, quantity: 4, material: 'MDF', shapeType: 'rect', canRotate: true }
    ];

    const result = await optimizeCuttingPlan(pieces, {
      kerf: 3,
      edgeTrim: 10,
      safetyMargin: 8,
      maxIterations: 20,
      maxTimeMs: 300,
      mode: 'hybrid_parallel',
      seed: 42
    });

    expect(result.stats.usedSheets).toBeGreaterThan(0);
    expect(result.stats.utilizedArea).toBeGreaterThan(0);
    expect(result.placements.length).toBe(12);
  });
});
