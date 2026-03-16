# Otimizador de chapas (React + Tailwind + TypeScript + WebAssembly)

Interface para visualizar chapas em SVG e motor iterativo de otimização com 4 modos:

1. `guillotine_only`
2. `irregular_only`
3. `hybrid_alternating`
4. `hybrid_parallel`

## Arquitetura

- **Módulo WebAssembly** (`wasm/packing_solver_bindings.cpp`) para encapsular PackingSolver.
- **Interface JavaScript/TypeScript** (`src/wasm/packingSolver.ts`) para enviar peças/parâmetros e obter layout.
- **Motor iterativo** (`src/optimizer/engine.ts`) com seed, randomização de ordem/rotação/estratégia e perturbação de parâmetros.
- **Avaliador de custo** (`src/optimizer/evaluator.ts`) priorizando:
  - menor número de chapas
  - menor desperdício
  - menor número de cortes
  - preferência por guillotine quando aplicável

## Rodando

```bash
npm install
npm run dev
```

## Dados de saída da otimização

- lista de chapas utilizadas
- posição/orientação de cada peça
- sequência de cortes guilhotina (quando aplicável)
- estatísticas de desperdício
- área total utilizada

## Observação

`src/wasm/packingSolver.ts` inclui fallback heurístico em TS para facilitar execução imediata. Ao compilar o PackingSolver real para WASM, substitua os métodos `heuristicGuillotine` e `heuristicIrregular` por chamadas do módulo compilado.
