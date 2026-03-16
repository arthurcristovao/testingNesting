import type { OptimizationSolution } from '../types';

const VIEWBOX_WIDTH = 700;
const VIEWBOX_HEIGHT = 470;

interface Props {
  solution: OptimizationSolution;
}

export function SheetViewer({ solution }: Props) {
  return (
    <div className="space-y-4">
      {solution.sheets.map((sheet) => {
        const placements = solution.placements.filter((p) => p.sheetId === sheet.id);
        return (
          <div key={sheet.id} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <p className="mb-2 text-sm text-slate-300">
              {sheet.id} • {placements.length} peças
            </p>
            <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full rounded bg-slate-950">
              <rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="#0f172a" stroke="#334155" />
              {placements.map((p) => {
                const x = (p.x / sheet.width) * VIEWBOX_WIDTH;
                const y = (p.y / sheet.height) * VIEWBOX_HEIGHT;
                const w = (p.width / sheet.width) * VIEWBOX_WIDTH;
                const h = (p.height / sheet.height) * VIEWBOX_HEIGHT;

                return (
                  <g key={p.pieceId}>
                    <rect x={x} y={y} width={w} height={h} fill={p.modeUsed === 'guillotine' ? '#0ea5e9' : '#8b5cf6'} stroke="#e2e8f0" strokeWidth={1} opacity={0.85} />
                    <text x={x + 4} y={y + 14} fill="white" fontSize={11}>
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
