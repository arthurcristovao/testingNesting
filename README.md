# Otimizador de corte de chapas (React + TS + Tailwind + C++/WASM)

Interface para visualizar chapas/peças em SVG e motor iterativo para buscar layouts melhores ao longo do tempo.

## O que foi implementado

- UI React com geração aleatória de peças retangulares e irregulares (quantidade e tamanhos configuráveis).
- Otimização iterativa com 4 modos: `auto`, `guillotine`, `irregular`, `hybrid`.
- Randomização por seed em cada iteração: ordem de peças, rotação, perturbações de kerf/margem, estratégia de inserção.
- Inclusão automática de chapas padrão `2750 x 1850` quando faltar espaço.
- Métricas: desperdício, área utilizada, aproveitamento, chapas usadas e número de cortes.
- Saída de sequência de cortes guilhotina quando aplicável.

## Estrutura

- `src/engine/pieceGenerator.ts`: geração de peças aleatórias (retangulares/poligonais).
- `src/engine/optimizer.ts`: loop iterativo com lotes paralelos por `parallelWorkers`.
- `src/wasm/packingSolverWasm.ts`: API JS para módulo wasm compilado.
- `cpp/packing_solver_bridge.cpp`: ponte C++ para integrar o PackingSolver real.
- `scripts/build-native.sh`: build binário C++ local.
- `scripts/build-wasm.sh`: build para WebAssembly com Emscripten.

## Integrando o PackingSolver (Florian Fontan)

Repositório oficial: https://github.com/fontanf/packingsolver

> Neste ambiente, o download externo pode estar bloqueado. Se estiver disponível no seu ambiente:

```bash
mkdir -p third_party
cd third_party
git clone https://github.com/fontanf/packingsolver.git
```

Depois, ajuste a ponte C++ (`cpp/packing_solver_bridge.cpp`) para incluir e chamar os módulos de:

- **Irregular packing solver**
- **Guillotine solver**

## Execução local

```bash
npm install
npm run dev
```

## Build da ponte C++

```bash
./scripts/build-native.sh
```

## Build WASM (emscripten)

```bash
./scripts/build-wasm.sh
```
