import { useMemo, useState } from 'react';
import { optimizeCuttingPlan } from './engine/optimizer';
import { generateRandomPieces } from './engine/pieceGenerator';
import type { CuttingParams, OptimizationSolution, PieceGenerationConfig, PieceRequest } from './types';
import { SheetViewer } from './components/SheetViewer';

const initialParams: CuttingParams = {
  kerf: 3.2,
  trim: 15,
  safetyMargin: 4,
  maxIterations: 300,
  maxTimeMs: 2500,
  seed: 12345,
  mode: 'hybrid',
  parallelWorkers: 4,
};

const initialGeneration: PieceGenerationConfig = {
  totalPieces: 100,
  minWidth: 200,
  maxWidth: 900,
  minHeight: 120,
  maxHeight: 650,
  irregularRatio: 0.35,
  rotatableRatio: 0.8,
  material: 'mdf-18mm',
};

export default function App() {
  const [params, setParams] = useState<CuttingParams>(initialParams);
  const [genConfig, setGenConfig] = useState<PieceGenerationConfig>(initialGeneration);
  const [pieces, setPieces] = useState<PieceRequest[]>(() => generateRandomPieces(initialGeneration, initialParams.seed));
  const [running, setRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [solution, setSolution] = useState<OptimizationSolution | null>(null);

  const regeneratePieces = () => {
    setPieces(generateRandomPieces(genConfig, params.seed));
    setSolution(null);
  };

  const stats = useMemo(() => {
    if (!solution) return null;
    return [
      ['Chapas', solution.metrics.usedSheets],
      ['Peças alocadas', solution.metrics.totalPiecesPlaced],
      ['Aproveitamento', `${(solution.metrics.utilizationRate * 100).toFixed(2)}%`],
      ['Área usada', `${solution.metrics.usedArea.toFixed(0)} mm²`],
      ['Desperdício', `${solution.metrics.wasteArea.toFixed(0)} mm²`],
      ['Cortes', solution.metrics.totalCuts],
      ['Iteração vencedora', solution.iteration],
      ['Seed vencedora', solution.seed],
    ];
  }, [solution]);

  const runOptimization = async () => {
    setRunning(true);
    setIteration(0);
    const best = await optimizeCuttingPlan(pieces, params, ({ currentIteration, best: interim }) => {
      setIteration(currentIteration);
      setSolution(interim);
    });
    setSolution(best);
    setRunning(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[390px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h1 className="text-xl font-semibold">Plano de corte com PackingSolver (WASM/C++)</h1>
          <p className="mt-1 text-sm text-slate-400">Gere peças retangulares/irregulares e rode otimização iterativa em 4 modos.</p>

          <h2 className="mt-4 text-sm font-semibold text-cyan-300">Gerador aleatório de peças</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <label>Qtd. peças<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={genConfig.totalPieces} onChange={(e) => setGenConfig((o) => ({ ...o, totalPieces: Number(e.target.value) }))} /></label>
            <label>Material<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" value={genConfig.material} onChange={(e) => setGenConfig((o) => ({ ...o, material: e.target.value }))} /></label>
            <label>Largura mín<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={genConfig.minWidth} onChange={(e) => setGenConfig((o) => ({ ...o, minWidth: Number(e.target.value) }))} /></label>
            <label>Largura máx<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={genConfig.maxWidth} onChange={(e) => setGenConfig((o) => ({ ...o, maxWidth: Number(e.target.value) }))} /></label>
            <label>Altura mín<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={genConfig.minHeight} onChange={(e) => setGenConfig((o) => ({ ...o, minHeight: Number(e.target.value) }))} /></label>
            <label>Altura máx<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={genConfig.maxHeight} onChange={(e) => setGenConfig((o) => ({ ...o, maxHeight: Number(e.target.value) }))} /></label>
            <label>% irregulares<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" min={0} max={1} step="0.05" value={genConfig.irregularRatio} onChange={(e) => setGenConfig((o) => ({ ...o, irregularRatio: Number(e.target.value) }))} /></label>
            <label>% rotacionáveis<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" min={0} max={1} step="0.05" value={genConfig.rotatableRatio} onChange={(e) => setGenConfig((o) => ({ ...o, rotatableRatio: Number(e.target.value) }))} /></label>
          </div>

          <h2 className="mt-4 text-sm font-semibold text-cyan-300">Parâmetros de corte e busca</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <label>Seed<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={params.seed} onChange={(e) => setParams((o) => ({ ...o, seed: Number(e.target.value) }))} /></label>
            <label>Modo<select className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" value={params.mode} onChange={(e) => setParams((o) => ({ ...o, mode: e.target.value as CuttingParams['mode'] }))}><option value="auto">Auto</option><option value="guillotine">Guillotine</option><option value="irregular">Irregular</option><option value="hybrid">Híbrido</option></select></label>
            <label>Kerf<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" step="0.1" value={params.kerf} onChange={(e) => setParams((o) => ({ ...o, kerf: Number(e.target.value) }))} /></label>
            <label>Apara borda<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={params.trim} onChange={(e) => setParams((o) => ({ ...o, trim: Number(e.target.value) }))} /></label>
            <label>Margem segurança<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" step="0.1" value={params.safetyMargin} onChange={(e) => setParams((o) => ({ ...o, safetyMargin: Number(e.target.value) }))} /></label>
            <label>Workers<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" min={1} max={16} value={params.parallelWorkers} onChange={(e) => setParams((o) => ({ ...o, parallelWorkers: Number(e.target.value) }))} /></label>
            <label>Tempo ms<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={params.maxTimeMs} onChange={(e) => setParams((o) => ({ ...o, maxTimeMs: Number(e.target.value) }))} /></label>
            <label>Iterações<input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={params.maxIterations} onChange={(e) => setParams((o) => ({ ...o, maxIterations: Number(e.target.value) }))} /></label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400" onClick={regeneratePieces}>Gerar peças</button>
            <button className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50" onClick={() => void runOptimization()} disabled={running}>{running ? `Otimizando (${iteration})` : 'Executar otimização'}</button>
          </div>

          <p className="mt-2 text-xs text-slate-400">Peças no lote: {pieces.length} (retangulares + irregulares com tamanhos aleatórios).</p>

          {stats && (
            <ul className="mt-4 space-y-1 text-xs">
              {stats.map(([label, value]) => (
                <li key={label} className="flex justify-between rounded bg-slate-950 px-3 py-2">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium">{value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          {solution ? (
            <>
              <SheetViewer solution={solution} />
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs">
                <p className="mb-2 font-semibold">Sequência de cortes guilhotina (quando aplicável)</p>
                <div className="max-h-44 overflow-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-slate-400"><th>Chapa</th><th>Orientação</th><th>Posição</th><th>Prof.</th></tr></thead>
                    <tbody>
                      {solution.guillotineCuts.map((cut, idx) => (
                        <tr key={`${cut.sheetId}-${idx}`}><td>{cut.sheetId}</td><td>{cut.orientation}</td><td>{cut.at.toFixed(0)} mm</td><td>{cut.depth}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 text-slate-400">Gere as peças e execute a otimização para visualizar o layout SVG.</div>
          )}
        </section>
      </div>
    </main>
  );
}
