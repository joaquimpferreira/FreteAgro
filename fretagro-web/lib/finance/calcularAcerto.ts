// Settlement calculation engine — FR-021, SC-002
// Single rounding point: valorComissao only (Math.round). saldoFinal NEVER rounded.
// Principle IV: money is always integer centavos.

export interface DeducaoItem {
  id: string;
  tipo: string;
  descricao: string | null;
  valor: number; // centavos
}

export interface AcertoInput {
  valorFrete: number; // centavos
  percentualComissao: number; // integer 0–100
  deducoes: DeducaoItem[];
}

export interface AcertoCalculado {
  valorFrete: number;
  percentualComissao: number;
  valorComissao: number; // Math.round(valorFrete × percentualComissao / 100)
  totalDeducoes: number; // Σ deducoes[].valor
  saldoFinal: number; // valorComissao − totalDeducoes (NEVER rounded)
  deducoes: DeducaoItem[];
}

/**
 * Computes settlement amounts from freight value, driver commission %, and deductions.
 *
 * Rounding rule (constitution Principle IV):
 *   - valorComissao: single Math.round at the multiplication point
 *   - saldoFinal: integer subtraction, never rounded
 */
export function calcularAcerto(input: AcertoInput): AcertoCalculado {
  const { valorFrete, percentualComissao, deducoes } = input;

  const valorComissao = Math.round((valorFrete * percentualComissao) / 100);
  const totalDeducoes = deducoes.reduce((sum, d) => sum + d.valor, 0);
  const saldoFinal = valorComissao - totalDeducoes;

  return {
    valorFrete,
    percentualComissao,
    valorComissao,
    totalDeducoes,
    saldoFinal,
    deducoes,
  };
}
