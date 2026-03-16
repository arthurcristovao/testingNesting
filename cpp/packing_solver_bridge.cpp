#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

// Bridge mínima: preparada para integrar com o código do projeto
// https://github.com/fontanf/packingsolver quando `third_party/packingsolver/src`
// estiver presente e buildado com CMake/Emscripten.
//
// Modo atual (fallback): ecoa um JSON válido para a UI em caso de execução local.

int main(int argc, char** argv) {
    if (argc < 2) {
        std::cerr << "usage: packing_solver_bridge <input.json>\n";
        return 1;
    }

    std::ifstream in(argv[1]);
    if (!in) {
        std::cerr << "cannot open input file\n";
        return 2;
    }

    std::ostringstream payload;
    payload << in.rdbuf();

    // TODO: trocar por chamada real ao packingsolver::irregular / guillotine.
    // Saída stub compatível com a API JS:
    std::cout << R"({"ok":true,"engine":"cpp-bridge","note":"Packingsolver source not bundled in this environment."})";
    return 0;
}
