# Otimizador de corte de chapas (React + TS + Tailwind + C++/WASM)

Interface para visualizar chapas/peças em SVG e motor iterativo para buscar layouts melhores ao longo do tempo.

## O que foi implementado

- UI React com geração aleatória de peças retangulares e irregulares (quantidade e tamanhos configuráveis).
- Otimização iterativa com 4 modos: `auto`, `guillotine`, `irregular`, `hybrid`.
- Randomização por seed em cada iteração: ordem de peças, rotação, perturbações de kerf/margem, estratégia de inserção.
- Inclusão automática de chapas padrão `2750 x 1850` quando faltar espaço.
- Métricas: desperdício, área utilizada, aproveitamento, chapas usadas e número de cortes.
- Saída de sequência de cortes guilhotina quando aplicável.

## Tudo dentro de `src/`

Conforme solicitado, o conteúdo de implementação fica dentro da pasta `src`:

- `src/engine/*`: motor de otimização e geração de peças.
- `src/wasm/*`: loader do módulo wasm e fallback heurístico.
- `src/native/bridge/packing_solver_bridge.cpp`: ponte C++.
- `src/native/scripts/*`: scripts de build native/wasm.
- `src/native/packingsolver/`: pasta para manter os algoritmos C++ do PackingSolver.

## Integrando o PackingSolver (Florian Fontan)

Repositório oficial: https://github.com/fontanf/packingsolver

Copie/clone os fontes C++ para dentro de `src/native/packingsolver`:

```bash
git clone https://github.com/fontanf/packingsolver.git src/native/packingsolver
```

Depois ajuste `src/native/bridge/packing_solver_bridge.cpp` para incluir e chamar os módulos de:

- **Irregular packing solver**
- **Guillotine solver**

## Execução local

```bash
npm install
npm run dev
```

## Build da ponte C++

```bash
npm run build:cpp
```

## Build WASM (emscripten)

```bash
npm run build:wasm
```


## Código C/C++ oficial (fora de `src` do app)

Conforme solicitado, o código vindo de `https://github.com/fontanf/packingsolver/tree/master/src` deve ficar na pasta:

- `packingsolver_upstream_c/`

Automatizamos isso com:

```bash
./scripts_download_packingsolver_src.sh
```

Esse script faz sparse-checkout apenas do diretório `src` do repositório oficial e copia tudo para `packingsolver_upstream_c`.
