// types/caixa.ts — cash-flow entry and aggregation types
// Layer: types — no imports from lib/, hooks/, components/, or app/

export type TipoLancamentoCaixa =
  | 'entrada'
  | 'comissao'
  | 'manutencao'
  | 'patio'
  | 'combustivel'
  | 'salario'
  | 'impostos'
  | 'outro'

export interface LancamentoCaixa {
  id: string
  tipo: TipoLancamentoCaixa
  // centavos
  valor: number
  descricao?: string
  data: string
  frotaId: string
  createdAt: string
}

// Input to POST /api/caixa (manual outflow — FR-030)
export interface LancamentoCaixaCreateInput {
  tipo: Exclude<TipoLancamentoCaixa, 'entrada'>
  // centavos
  valor: number
  descricao?: string
  data: string
}

// Period-level aggregation returned by GET /api/caixa
export interface ExtratoCaixa {
  from: string
  to: string
  // centavos
  totalReceitas: number
  totalDespesas: number
  lucroLiquido: number
  despesasPorCategoria: DespesaCategoria[]
  entradas: LancamentoCaixa[]
  saidas: LancamentoCaixa[]
}

export interface DespesaCategoria {
  categoria: TipoLancamentoCaixa
  total: number
  percentual: number
}

// Filters for GET /api/caixa
export interface CaixaFilters {
  from: string
  to: string
  page?: number
  pageSize?: number
}
