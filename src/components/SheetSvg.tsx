import { OptimizationSolution } from '../optimizer/types';

interface Props {
  solution: OptimizationSolution;
}

export function SheetSvg({ solution }: Props) {
  const scale = 0.16;
  const usedSheets = solution.sheets.filter((s) => solution.placements.some((p) => p.sheetId === s.id));

  return (
    <div className="space-y-4">
      {usedSheets.map((sheet) => (
        <div key={sheet.id} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
          <p className="mb-2 text-sm text-slate-300">{sheet.id} ({sheet.width}x{sheet.height} mm)</p>
          <svg width={sheet.width * scale} height={sheet.height * scale} className="bg-slate-800">
            <rect x={0} y={0} width={sheet.width * scale} height={sheet.height * scale} fill="#0f172a" stroke="#475569" />
            {solution.placements
              .filter((p) => p.sheetId === sheet.id)
              .map((p) => (
                <g key={p.instanceId}>
                  <rect
                    x={p.x * scale}
                    y={p.y * scale}
                    width={p.width * scale}
                    height={p.height * scale}
                    fill={p.modeUsed === 'guillotine' ? '#22c55e88' : '#a855f788'}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                  <text x={(p.x + 5) * scale} y={(p.y + 14) * scale} fill="white" fontSize="8">
                    {p.pieceId}
                  </text>
                </g>
              ))}
          </svg>
        </div>
      ))}
    </div>
  );
}
