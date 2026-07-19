// types/viagem.ts — active trip, road-segment, and refueling types
// Layer: types — no imports from lib/, hooks/, components/, or app/
// Used by both fretagro-web (settlement calculations) and fretagro-mobile (trip tracking)

import type { Lancamento } from './frete'

export type TipoTrecho = 'vazio' | 'carregado'
export type SubtipoAbastecimento = 'diesel' | 'arla'

/**
 * A road segment within an active trip.
 * kmRodado is computed on closure: kmFinal − kmInicial.
 */
export interface TrechoKm {
  id: string
  tipo: TipoTrecho
  kmInicial: number
  kmFinal?: number
  /** Computed on closure: kmFinal − kmInicial */
  kmRodado?: number
  ordem: number
  freteId: string
  frotaId: string
  /** ISO datetime when this leg was closed; null while open */
  fechadoEm?: string
  createdAt: string
}

/**
 * A refueling event recorded during an active trip.
 * valorTotal is stored in centavos: Math.round(litros × precoPorLitro × 100).
 * trechoId links to the open leg at registration time — enables mediaDiesel per FR-013.
 */
export interface Abastecimento {
  id: string
  subtipo: SubtipoAbastecimento
  /** Decimal liters */
  litros: number
  /** Decimal price per liter (BRL) */
  precoPorLitro: number
  /** centavos: Math.round(litros × precoPorLitro × 100) */
  valorTotal: number
  local?: string
  kmAtual?: number
  fotoUrl?: string
  /**
   * Optional FK to TrechoKm.
   * Populated with the current open leg id at registration.
   * Enables per-leg mediaDiesel calculation per FR-013.
   */
  trechoId?: string
  freteId: string
  frotaId: string
  createdAt: string
}

/**
 * In-memory (and MMKV-persisted) state of an ongoing trip.
 * Persisted locally by fretagro-mobile; cleared after sync is confirmed.
 */
export interface ViagemAtiva {
  freteId: string
  /** Trip origin city/location — persisted for offline display on home screen (US7) */
  origem?: string
  /** Trip destination city/location — persisted for offline display on home screen (US7) */
  destino?: string
  /** Ordered list of all legs; last element is the currently open leg */
  trechos: TrechoKm[]
  /** Index into trechos[] pointing to the currently open (unclosed) leg */
  trechoAtualIndex: number
  /** General expenses (Lancamento) recorded during this trip */
  despesas: Lancamento[]
  /** Refueling events recorded during this trip */
  abastecimentos: Abastecimento[]
  /** ISO datetime of last successful sync to Supabase */
  ultimaSincronizacao?: string
  /** True when local mutations exist that have not yet been synced */
  pendenteSincronizacao: boolean
}
