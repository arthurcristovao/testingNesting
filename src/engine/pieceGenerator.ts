import type { PieceGenerationConfig, PieceRequest } from '../types';
import { SeededRandom } from './random';

function randomPolygon(width: number, height: number, random: SeededRandom) {
  const inset = Math.max(20, Math.min(width, height) * 0.15);
  return [
    { x: 0, y: 0 },
    { x: width, y: random.int(0, inset) },
    { x: width - random.int(0, inset), y: height },
    { x: random.int(0, inset), y: height - random.int(0, inset) },
  ];
}

export function generateRandomPieces(config: PieceGenerationConfig, seed: number): PieceRequest[] {
  const random = new SeededRandom(seed);

  return Array.from({ length: config.totalPieces }, (_, i) => {
    const width = random.int(config.minWidth, config.maxWidth);
    const height = random.int(config.minHeight, config.maxHeight);
    const irregular = random.next() < config.irregularRatio;

    return {
      id: `piece-${i + 1}`,
      label: irregular ? `Peça irregular ${i + 1}` : `Peça retangular ${i + 1}`,
      quantity: 1,
      material: config.material,
      rotatable: random.next() < config.rotatableRatio,
      shape: irregular
        ? {
            kind: 'polygon' as const,
            points: randomPolygon(width, height, random),
            boundingWidth: width,
            boundingHeight: height,
          }
        : {
            kind: 'rectangle' as const,
            width,
            height,
          },
    };
  });
}
