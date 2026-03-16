import { useMemo, useState } from 'react';
import { optimizeCuttingPlan } from './optimizer/engine';
import { OptimizationMode, OptimizationParams, OptimizationSolution, PieceInput } from './optimizer/types';
import { SheetSvg } from './components/SheetSvg';

const defaultPieces: PieceInput[] = [
  { id: 'Lateral-A', width: 600, height: 400, quantity: 20, material: 'MDF 18mm', shapeType: 'rect', canRotate: true },
  { id: 'Porta-B', width: 450, height: 700, quantity: 10, material: 'MDF 18mm', shapeType: 'rect', canRotate: true },
  {
    id: 'Curva-C',
    width: 520,
    height: 320,
    quantity: 8,
    material: 'MDF 18mm',
    shapeType: 'polygon',
    polygon: [[0, 0], [520, 0], [400, 300], [0, 320]],
    canRotate: false
  }
];

export default function App() {
  const [mode, setMode] = useState<OptimizationMode>('hybrid_parallel');
  const [maxIterations, setMaxIterations] = useState(120);
  const [maxTimeMs, setMaxTimeMs] = useState(3500);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 100_000));
  const [running, setRunning] = useState(false);
  const [solution, setSolution] = useState<OptimizationSolution | null>(null);

  const params: OptimizationParams = useMemo(
    () => ({
      kerf: 3,
      edgeTrim: 10,
      safetyMargin: 8,
      maxIterations,
      maxTimeMs,
      seed,
      mode
    }),
    [maxIterations, maxTimeMs, mode, seed]
  );

  async function run() {
    setRunning(true);
    const best = await optimizeCuttingPlan(defaultPieces, params, setSolution);
    setSolution(best);
    setRunning(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Otimizador de Corte de Chapas (WASM + PackingSolver)</h1>
      <p className="mt-2 text-sm text-slate-400">Modos: guillotine, irregular, híbrido alternado e híbrido paralelo.</p>

      <section className="mt-6 grid gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 md:grid-cols-4">
        <label className="text-sm">Modo
          <select className="mt-1 w-full rounded bg-slate-800 p-2" value={mode} onChange={(e) => setMode(e.target.value as OptimizationMode)}>
            <option value="guillotine_only">Guillotine only</option>
            <option value="irregular_only">Irregular only</option>
            <option value="hybrid_alternating">Híbrido alternado</option>
            <option value="hybrid_parallel">Híbrido paralelo</option>
          </select>
        </label>

        <label className="text-sm">Iterações
          <input className="mt-1 w-full rounded bg-slate-800 p-2" type="number" value={maxIterations} onChange={(e) => setMaxIterations(Number(e.target.value))} />
        </label>

        <label className="text-sm">Tempo máximo (ms)
          <input className="mt-1 w-full rounded bg-slate-800 p-2" type="number" value={maxTimeMs} onChange={(e) => setMaxTimeMs(Number(e.target.value))} />
        </label>

        <label className="text-sm">Seed
          <input className="mt-1 w-full rounded bg-slate-800 p-2" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        </label>
      </section>

      <button onClick={run} disabled={running} className="mt-4 rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
        {running ? 'Otimizando...' : 'Iniciar otimização'}
      </button>

      {solution && (
        <section className="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
            <h2 className="mb-2 font-semibold">Melhor solução</h2>
            <ul className="space-y-1 text-slate-300">
              <li>Chapas usadas: {solution.stats.usedSheets}</li>
              <li>Área utilizada: {solution.stats.utilizedArea.toFixed(0)} mm²</li>
              <li>Desperdício: {solution.stats.wasteArea.toFixed(0)} mm²</li>
              <li>Cortes: {solution.stats.totalCuts}</li>
              <li>Score: {solution.stats.score.toFixed(0)}</li>
              <li>Iteração: {solution.stats.iteration}</li>
              <li>Seed: {solution.stats.seed}</li>
            </ul>
          </aside>
          <SheetSvg solution={solution} />
        </section>
      )}
    </main>
  );
}
