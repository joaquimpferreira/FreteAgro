// types/acerto.ts — settlement and deduction types
// Layer: types — no imports from lib/, hooks/, components/, or app/

export type StatusAcerto = 'pendente' | 'realizado'

export interface Acerto {
  id: string
  // Centavos snapshots
  valorFrete: number
  percentualComissao: number
  // valorComissao = Math.round(valorFrete * percentualComissao / 100)
  valorComissao: number
  // totalDeducoes = Σ linked Lancamento.valor where deducaoAcerto = true
  totalDeducoes: number
  // saldoFinal = valorComissao − totalDeducoes (never rounded — Principle IV)
  saldoFinal: number
  status: StatusAcerto
  comprovanteUrl?: string
  freteId: string
  motoristaId: string
  createdAt: string
  realizadoEm?: string
}

// Input to open a new settlement (POST /api/acertos)
export interface AcertoCreateInput {
  freteId: string
}

// Confirmation payload (PATCH /api/acertos/[id])
export interface AcertoConfirmInput {
  confirmar: true
}

// Intermediate calc result from lib/finance/calcularAcerto
export interface AcertoCalculo {
  valorFrete: number
  percentualComissao: number
  valorComissao: number
  totalDeducoes: number
  saldoFinal: number
}
