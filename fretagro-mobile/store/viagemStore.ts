// store/viagemStore.ts
// Layer: store (between lib and hooks) — imports from lib/ and @fretagro/types only.
// Zustand store for the active trip state.
// Every mutation persists to MMKV via viagemStorage before returning.

import { create } from 'zustand'
import type { ViagemAtiva, TrechoKm, Abastecimento } from '@fretagro/types'
import type { Lancamento, TipoCarga, TipoLancamento } from '@fretagro/types'
import { saveViagem, loadViagem } from '../lib/storage/viagemStorage'
import { enqueue } from '../lib/storage/queueStorage'
import type { OperacaoTipo } from '../lib/storage/queueStorage'
import { fecharTrecho } from '../lib/viagem/calcularTrecho'
import { createId } from '../lib/utils/createId'

// ─────────────────────────────────────────────────────────────────────────────
// Helper — enqueue an operation with a fresh timestamp
// ─────────────────────────────────────────────────────────────────────────────
function enqueueOp(tipo: OperacaoTipo, payload: Record<string, unknown>) {
  enqueue({
    id: createId(),
    tipo,
    payload,
    updatedAt: new Date().toISOString(),
    tentativas: 0,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────────────────────────────────────
export interface IniciarViagemParams {
  origem: string
  destino: string
  tipoCarga: TipoCarga
  kmInicial: number
  /** Optional Carta Frete value in centavos; defaults to 0 */
  valorBruto?: number
  caminhaoId: string
  motoristaId: string
  frotaId: string
}

export interface RegistrarAbastecimentoParams {
  subtipo: 'diesel' | 'arla'
  litros: number
  precoPorLitro: number
  local?: string
  kmAtual?: number
  fotoUrl?: string
}

export interface RegistrarDespesaParams {
  tipo: TipoLancamento
  valor: number
  descricao?: string
  fotoUrl?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────────────────────
interface ViagemStore {
  viagem: ViagemAtiva | null

  /**
   * Snapshot of the last completed trip — kept only while the resumo screen is
   * showing. Cleared by limparViagemEncerrada() when the user navigates away.
   */
  viagemEncerrada: ViagemAtiva | null

  /** Hydrates from MMKV. Call on app mount (T017) and after signOut. */
  hidratarFromStorage: (override?: ViagemAtiva | null) => void

  /** Starts a new trip, opens the first vazio leg, and enqueues CREATE_VIAGEM + CREATE_TRECHO. */
  iniciarViagem: (params: IniciarViagemParams) => void

  /** Closes the current leg and opens the next one with the given tipo. */
  avancarTrecho: (kmFinal: number, tipoProximoTrecho: TrechoKm['tipo'], kmProxInicial: number) => void

  /** Opens a new leg (called after avancarTrecho closes the previous one). */
  abrirNovoTrecho: (tipo: TrechoKm['tipo'], kmInicial: number, freteId: string, frotaId: string) => void

  /** Closes the last leg and the trip. Clears viagem (active trip) and stores snapshot in viagemEncerrada. */
  encerrarViagem: (kmFinal: number) => void

  /** Clears the completed trip snapshot. Call when leaving the resumo screen. */
  limparViagemEncerrada: () => void

  /**
   * Records a fuel refuel.
   * Automatically sets trechoId to the current open leg (enables mediaDiesel per FR-013).
   */
  registrarAbastecimento: (params: RegistrarAbastecimentoParams) => void

  /** Records a general expense (Lancamento). */
  registrarDespesa: (params: RegistrarDespesaParams) => void

  /** Called by useSync after a successful sync drain. */
  marcarSincronizado: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────────────────────
export const useViagemStore = create<ViagemStore>((set, get) => ({
  viagem: null,
  viagemEncerrada: null,

  hidratarFromStorage: (override) => {
    const viagem = override !== undefined ? override : loadViagem()
    set({ viagem })
  },

  iniciarViagem: (params) => {
    const freteId = createId()
    const trechoId = createId()
    const now = new Date().toISOString()

    const primeiroTrecho: TrechoKm = {
      id: trechoId,
      tipo: 'vazio',
      kmInicial: params.kmInicial,
      ordem: 1,
      freteId,
      frotaId: params.frotaId,
      createdAt: now,
    }

    const viagem: ViagemAtiva = {
      freteId,
      origem: params.origem,
      destino: params.destino,
      trechos: [primeiroTrecho],
      trechoAtualIndex: 0,
      despesas: [],
      abastecimentos: [],
      pendenteSincronizacao: true,
    }

    set({ viagem })
    saveViagem(viagem)

    enqueueOp('CREATE_VIAGEM', {
      id: freteId,
      frotaId: params.frotaId,
      caminhaoId: params.caminhaoId,
      motoristaId: params.motoristaId,
      origem: params.origem,
      destino: params.destino,
      tipoCarga: params.tipoCarga,
      kmInicial: params.kmInicial,
      dataInicio: now,
      valorBruto: params.valorBruto ?? 0,
      status: 'em_andamento',
    })

    enqueueOp('CREATE_TRECHO', {
      id: trechoId,
      tipo: 'vazio',
      kmInicial: params.kmInicial,
      ordem: 1,
      freteId,
      frotaId: params.frotaId,
      createdAt: now,
    })
  },

  avancarTrecho: (kmFinal, tipoProximoTrecho, kmProxInicial) => {
    const { viagem } = get()
    if (!viagem) return

    const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
    const trechoFechado = fecharTrecho(trechoAtual, kmFinal)

    const nextIndex = viagem.trechoAtualIndex + 1
    const novoTrechoId = createId()
    const now = new Date().toISOString()

    const novoTrecho: TrechoKm = {
      id: novoTrechoId,
      tipo: tipoProximoTrecho,
      kmInicial: kmProxInicial,
      ordem: nextIndex + 1,
      freteId: viagem.freteId,
      frotaId: trechoAtual.frotaId,
      createdAt: now,
    }

    const trechos = [...viagem.trechos]
    trechos[viagem.trechoAtualIndex] = trechoFechado
    trechos.push(novoTrecho)

    const updated: ViagemAtiva = {
      ...viagem,
      trechos,
      trechoAtualIndex: nextIndex,
      pendenteSincronizacao: true,
    }

    set({ viagem: updated })
    saveViagem(updated)

    enqueueOp('CLOSE_TRECHO', {
      id: trechoAtual.id,
      kmFinal: trechoFechado.kmFinal,
      kmRodado: trechoFechado.kmRodado,
      fechadoEm: trechoFechado.fechadoEm,
    })

    enqueueOp('CREATE_TRECHO', {
      id: novoTrechoId,
      tipo: tipoProximoTrecho,
      kmInicial: kmProxInicial,
      ordem: novoTrecho.ordem,
      freteId: viagem.freteId,
      frotaId: trechoAtual.frotaId,
      createdAt: now,
    })
  },

  abrirNovoTrecho: (tipo, kmInicial, freteId, frotaId) => {
    const { viagem } = get()
    if (!viagem) return

    const novoTrechoId = createId()
    const now = new Date().toISOString()
    const ordem = viagem.trechos.length + 1

    const novoTrecho: TrechoKm = {
      id: novoTrechoId,
      tipo,
      kmInicial,
      ordem,
      freteId,
      frotaId,
      createdAt: now,
    }

    const trechos = [...viagem.trechos, novoTrecho]
    const updated: ViagemAtiva = {
      ...viagem,
      trechos,
      trechoAtualIndex: trechos.length - 1,
      pendenteSincronizacao: true,
    }

    set({ viagem: updated })
    saveViagem(updated)

    enqueueOp('CREATE_TRECHO', {
      id: novoTrechoId,
      tipo,
      kmInicial,
      ordem,
      freteId,
      frotaId,
      createdAt: now,
    })
  },

  encerrarViagem: (kmFinal) => {
    const { viagem } = get()
    if (!viagem) return

    const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
    const trechoFechado = fecharTrecho(trechoAtual, kmFinal)

    const trechos = [...viagem.trechos]
    trechos[viagem.trechoAtualIndex] = trechoFechado

    // Build the completed trip snapshot (used by resumo screen)
    const snapshot: ViagemAtiva = {
      ...viagem,
      trechos,
      pendenteSincronizacao: true,
    }

    // Clear the active trip so home/em-curso screens stop showing "viagem em andamento".
    // Keep the snapshot in viagemEncerrada for the resumo screen to display.
    set({ viagem: null, viagemEncerrada: snapshot })
    saveViagem(null)

    enqueueOp('CLOSE_TRECHO', {
      id: trechoAtual.id,
      kmFinal: trechoFechado.kmFinal,
      kmRodado: trechoFechado.kmRodado,
      fechadoEm: trechoFechado.fechadoEm,
    })

    enqueueOp('CLOSE_VIAGEM', {
      id: viagem.freteId,
      status: 'concluido',
      kmFinal: trechoFechado.kmFinal,
      dataFim: new Date().toISOString(),
    })
  },

  limparViagemEncerrada: () => {
    set({ viagemEncerrada: null })
  },

  registrarAbastecimento: (params) => {
    const { viagem } = get()
    if (!viagem) return

    const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
    const id = createId()
    const now = new Date().toISOString()
    const valorTotal = Math.round(params.litros * params.precoPorLitro * 100)

    const abastecimento: Abastecimento = {
      id,
      subtipo: params.subtipo,
      litros: params.litros,
      precoPorLitro: params.precoPorLitro,
      valorTotal,
      local: params.local,
      kmAtual: params.kmAtual,
      fotoUrl: params.fotoUrl,
      // Automatically links to the current open leg (enables mediaDiesel per FR-013)
      trechoId: trechoAtual.id,
      freteId: viagem.freteId,
      frotaId: trechoAtual.frotaId,
      createdAt: now,
    }

    const updated: ViagemAtiva = {
      ...viagem,
      abastecimentos: [...viagem.abastecimentos, abastecimento],
      pendenteSincronizacao: true,
    }

    set({ viagem: updated })
    saveViagem(updated)

    enqueueOp('CREATE_ABASTECIMENTO', { ...abastecimento })
  },

  registrarDespesa: (params) => {
    const { viagem } = get()
    if (!viagem) return

    const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
    const id = createId()
    const now = new Date().toISOString()

    const despesa: Lancamento = {
      id,
      tipo: params.tipo,
      valor: params.valor,
      descricao: params.descricao,
      fotoUrl: params.fotoUrl,
      deducaoAcerto: true,
      freteId: viagem.freteId,
      frotaId: trechoAtual.frotaId,
      createdAt: now,
    }

    const updated: ViagemAtiva = {
      ...viagem,
      despesas: [...viagem.despesas, despesa],
      pendenteSincronizacao: true,
    }

    set({ viagem: updated })
    saveViagem(updated)

    enqueueOp('CREATE_LANCAMENTO', { ...despesa })
  },

  marcarSincronizado: () => {
    const { viagem } = get()
    if (!viagem) return

    const updated: ViagemAtiva = {
      ...viagem,
      pendenteSincronizacao: false,
      ultimaSincronizacao: new Date().toISOString(),
    }

    set({ viagem: updated })
    saveViagem(updated)
  },
}))
