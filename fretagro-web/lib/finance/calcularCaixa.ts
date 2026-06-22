// Net-profit and expense-composition aggregation for fleet cash flow
// US5 — FR-031, FR-032 · Principle IV: all money integer centavos.
// Single responsibility: pure math, no I/O.

// ─── Input types ─────────────────────────────────────────────────────────────

/** A concluded freight that generated revenue in the period */
export interface FreteReceitaItem {
  freteId: string
  /** Gross value in centavos (valorBruto) */
  valor: number
  /** ISO date string (dataFim or dataInicio) */
  data: string
}

/** A single expense entry — can be frete-linked or avulso */
export interface LancamentoExpenseItem {
  /** TipoLancamento enum value */
  tipo: string
  /** Amount in centavos */
  valor: number
}

/** Driver commission extracted from a settled Acerto */
export interface ComissaoItem {
  /** valorComissao in centavos */
  valorComissao: number
}

export interface CaixaInput {
  receitas: FreteReceitaItem[]
  /** All Lancamento expenses in the period (both frete-linked and avulso) */
  lancamentos: LancamentoExpenseItem[]
  /** Commission amounts from Acertos in the period */
  comissoes: ComissaoItem[]
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface CategoriaTotal {
  categoria: string
  /** Centavos */
  total: number
  /** Percentage over totalDespesas (0–100); 0 when totalDespesas is 0 */
  percentual: number
}

export interface CaixaCalculado {
  receitas: {
    /** Σ FreteReceitaItem.valor — centavos */
    total: number
    itens: FreteReceitaItem[]
  }
  /** Expenses grouped by category, sorted descending by total */
  despesasPorCategoria: CategoriaTotal[]
  /** Σ all expense categories — centavos */
  totalDespesas: number
  /** receitas.total − totalDespesas — centavos (never rounded) */
  lucroLiquido: number
}

// ─── Core function ─────────────────────────────────────────────────────────────

/**
 * Aggregates fleet cash flow for a period.
 *
 * lucroLiquido = Σ receitas − Σ todas despesas   (FR-031)
 * Each category shows total + % over totalDespesas (FR-032)
 *
 * Commission category ('comissao') is derived from Acerto.valorComissao
 * rather than from Lancamento entries (commissions live in Acerto, not Lancamento).
 *
 * No rounding: integer arithmetic throughout (Principle IV).
 */
export function calcularCaixa(input: CaixaInput): CaixaCalculado {
  const { receitas, lancamentos, comissoes } = input

  // ── Receitas ────────────────────────────────────────────────────────────────
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0)

  // ── Build category expense map ──────────────────────────────────────────────
  const categoryMap = new Map<string, number>()

  for (const item of lancamentos) {
    categoryMap.set(item.tipo, (categoryMap.get(item.tipo) ?? 0) + item.valor)
  }

  // Add commission total as its own category (comes from Acerto, not Lancamento)
  const totalComissoes = comissoes.reduce((sum, c) => sum + c.valorComissao, 0)
  if (totalComissoes > 0) {
    categoryMap.set('comissao', (categoryMap.get('comissao') ?? 0) + totalComissoes)
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalDespesas = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0)

  const despesasPorCategoria: CategoriaTotal[] = Array.from(categoryMap.entries())
    .map(([categoria, total]) => ({
      categoria,
      total,
      percentual: totalDespesas > 0
        ? Math.round((total / totalDespesas) * 10000) / 100 // 2 decimal places
        : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    receitas: {
      total: totalReceitas,
      itens: receitas,
    },
    despesasPorCategoria,
    totalDespesas,
    lucroLiquido: totalReceitas - totalDespesas,
  }
}
