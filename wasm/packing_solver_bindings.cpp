// Exemplo de binding para compilar PackingSolver (Florian Fontan) com Emscripten.
// Ajuste includes conforme versão da lib.
#include <emscripten/bind.h>

using namespace emscripten;

std::string solve_guillotine(const std::string& json_input) {
  // TODO: chamar packingsolver::rectangleguillotine::optimize(...)
  return R"({\"status\":\"not_implemented\",\"mode\":\"guillotine\"})";
}

std::string solve_irregular(const std::string& json_input) {
  // TODO: chamar packingsolver::irregular::optimize(...)
  return R"({\"status\":\"not_implemented\",\"mode\":\"irregular\"})";
}

EMSCRIPTEN_BINDINGS(packing_solver_module) {
  function("solve_guillotine", &solve_guillotine);
  function("solve_irregular", &solve_irregular);
}
