# Otimizador de corte de chapas (React + TS + Tailwind + WebAssembly)

Projeto com interface SVG e motor iterativo para otimização de corte em marcenaria.

## Arquitetura

- `src/wasm/packingSolverWasm.ts`: camada de integração JS para um módulo WebAssembly do PackingSolver.
- `src/engine/optimizer.ts`: loop iterativo com limite de tempo e iterações.
- `src/engine/cost.ts`: função de custo priorizando chapas, desperdício e cortes.
- `src/wasm/simulatedPackingSolver.ts`: implementação heurística que simula o contrato do módulo wasm.
- `src/components/SheetViewer.tsx`: visualização SVG das chapas e peças.

## Como plugar o PackingSolver real

1. Compile o projeto C++ com Emscripten para `packing_solver.js/.wasm`.
2. No `loadPackingSolverWasm()`, substitua o stub por import dinâmico do módulo Emscripten.
3. Exponha funções para:
   - solver irregular
   - solver guillotine
   - configuração de kerf, trim, margens e seed
4. Mapeie o output C++ para `OptimizationSolution`.

## Execução

```bash
npm install
npm run dev
```
