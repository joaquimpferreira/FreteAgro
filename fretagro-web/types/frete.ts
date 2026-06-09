// types/frete.ts — freight, expense, and status types
// Layer: types — no imports from lib/, hooks/, components/, or app/

export type TipoCarga = 'grao' | 'oleo_soja' | 'farelo' | 'fertilizante' | 'outro'

export type StatusFrete =
  | 'em_andamento'
  | 'concluido'
  | 'acerto_pendente'
  | 'acerto_realizado'

export type TipoLancamento =
  | 'combustivel'
  | 'borracharia'
  | 'patio'
  | 'pedagio'
  | 'oficina'
  | 'vale'
  | 'adiantamento'
  | 'salario'
  | 'ipva'
  | 'seguro'
  | 'outro'

export interface Frete {
  id: string
  origem: string
  destino: string
  tipoCarga: TipoCarga
  kmInicial: number
  kmFinal?: number
  // centavos (Principle IV)
  valorBruto: number
  status: StatusFrete
  dataInicio: string
  dataFim?: string
  frotaId: string
  caminhaoId: string
  createdAt: string
  // Computed display value (sum of linked lancamentos)
  totalDespesas?: number
}

export interface Lancamento {
  id: string
  tipo: TipoLancamento
  descricao?: string
  // centavos
  valor: number
  fotoUrl?: string
  deducaoAcerto: boolean
  freteId?: string
  frotaId: string
  createdAt: string
}

export interface FreteCreateInput {
  caminhaoId: string
  origem: string
  destino: string
  tipoCarga: TipoCarga
  kmInicial: number
  // centavos
  valorBruto: number
  dataInicio: string
}

export interface FreteUpdateInput {
  kmFinal?: number
  status?: StatusFrete
  dataFim?: string
}

export interface LancamentoCreateInput {
  tipo: TipoLancamento
  // centavos
  valor: number
  descricao?: string
  deducaoAcerto?: boolean
  // fotoUrl is set after the file is uploaded to Supabase Storage
  fotoUrl?: string
}

// Filters for GET /api/fretes
export interface FreteFilters {
  status?: StatusFrete
  motoristaId?: string
  caminhaoId?: string
  from?: string
  to?: string
  rota?: string
  page?: number
  pageSize?: number
}
