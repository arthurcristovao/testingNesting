import { useMemo, useState } from 'react';
import { optimizeCuttingPlan } from './engine/optimizer';
import type { CuttingParams, OptimizationSolution, PieceRequest } from './types';
import { SheetViewer } from './components/SheetViewer';

const samplePieces: PieceRequest[] = [
  {
    id: 'lat-01',
    label: 'Lateral Armário',
    quantity: 25,
    material: 'mdf-18mm',
    rotatable: true,
    shape: { kind: 'rectangle', width: 800, height: 550 },
  },
  {
    id: 'prat-01',
    label: 'Prateleira',
    quantity: 40,
    material: 'mdf-18mm',
    rotatable: true,
    shape: { kind: 'rectangle', width: 650, height: 350 },
  },
  {
    id: 'porta-arc',
    label: 'Porta Curva',
    quantity: 12,
    material: 'mdf-18mm',
    rotatable: true,
    shape: {
      kind: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: 740, y: 0 },
        { x: 720, y: 200 },
        { x: 120, y: 460 },
        { x: 0, y: 300 },
      ],
      boundingWidth: 740,
      boundingHeight: 460,
    },
  },
];

const initialParams: CuttingParams = {
  kerf: 3.2,
  trim: 15,
  safetyMargin: 4,
  maxIterations: 300,
  maxTimeMs: 2500,
  seed: 12345,
  mode: 'hybrid',
};

export default function App() {
  const [params, setParams] = useState<CuttingParams>(initialParams);
  const [running, setRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [solution, setSolution] = useState<OptimizationSolution | null>(null);

  const stats = useMemo(() => {
    if (!solution) {
      return null;
    }
    return [
      ['Chapas', solution.metrics.usedSheets],
      ['Aproveitamento', `${(solution.metrics.utilizationRate * 100).toFixed(2)}%`],
      ['Desperdício', `${solution.metrics.wasteArea.toFixed(0)} mm²`],
      ['Cortes', solution.metrics.totalCuts],
      ['Iteração', solution.iteration],
      ['Seed', solution.seed],
    ];
  }, [solution]);

  const runOptimization = async () => {
    setRunning(true);
    setIteration(0);

    const best = await optimizeCuttingPlan(samplePieces, params, ({ currentIteration, best: interim }) => {
      setIteration(currentIteration);
      setSolution(interim);
    });

    setSolution(best);
    setRunning(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h1 className="text-xl font-semibold">Otimizador de Corte de Chapas</h1>
          <p className="mt-1 text-sm text-slate-400">React + Tailwind + TypeScript com motor iterativo em WebAssembly.</p>

          <div className="mt-4 grid gap-3 text-sm">
            <label>
              Seed aleatória
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                type="number"
                value={params.seed}
                onChange={(e) => setParams((old) => ({ ...old, seed: Number(e.target.value) }))}
              />
            </label>
            <label>
              Modo
              <select
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                value={params.mode}
                onChange={(e) => setParams((old) => ({ ...old, mode: e.target.value as CuttingParams['mode'] }))}
              >
                <option value="auto">Auto</option>
                <option value="guillotine">Guillotine</option>
                <option value="irregular">Irregular</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label>
              Tempo máximo (ms)
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                type="number"
                value={params.maxTimeMs}
                onChange={(e) => setParams((old) => ({ ...old, maxTimeMs: Number(e.target.value) }))}
              />
            </label>
            <label>
              Iterações máximas
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                type="number"
                value={params.maxIterations}
                onChange={(e) => setParams((old) => ({ ...old, maxIterations: Number(e.target.value) }))}
              />
            </label>
          </div>

          <button
            className="mt-4 w-full rounded-lg bg-cyan-500 px-3 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void runOptimization()}
            disabled={running}
          >
            {running ? `Otimizando... iteração ${iteration}` : 'Executar otimização'}
          </button>

          {stats && (
            <ul className="mt-4 space-y-2 text-sm">
              {stats.map(([label, value]) => (
                <li key={label} className="flex justify-between rounded bg-slate-950 px-3 py-2">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium">{value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          {solution ? (
            <SheetViewer solution={solution} />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 text-slate-400">
              Execute a otimização para visualizar as chapas em SVG.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
