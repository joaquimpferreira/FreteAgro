// Cost and profit helper — used by caixa aggregation and commission feed (US5, US6)
// All values are integer centavos. Principle IV.

export interface CustoInput {
  valorBruto: number; // freight gross value (centavos)
  totalDespesas: number; // Σ all Lancamento.valor for the freight (centavos)
  valorComissao: number; // driver commission (centavos), from calcularAcerto
}

export interface CustoCalculado {
  valorBruto: number;
  totalDespesas: number;
  valorComissao: number;
  // lucroOperacional = valorBruto − totalDespesas − valorComissao
  lucroOperacional: number;
  // margemPercent = (lucroOperacional / valorBruto) * 100; null when valorBruto is 0
  margemPercent: number | null;
}

/**
 * Computes operational cost/profit for a single freight.
 * Called by calcularCaixa to aggregate fleet-level cash flow.
 */
export function calcularCusto(input: CustoInput): CustoCalculado {
  const { valorBruto, totalDespesas, valorComissao } = input;

  const lucroOperacional = valorBruto - totalDespesas - valorComissao;
  const margemPercent = valorBruto > 0
    ? (lucroOperacional / valorBruto) * 100
    : null;

  return {
    valorBruto,
    totalDespesas,
    valorComissao,
    lucroOperacional,
    margemPercent,
  };
}
