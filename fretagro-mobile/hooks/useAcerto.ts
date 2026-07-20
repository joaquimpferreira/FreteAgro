// hooks/useAcerto.ts
// US6: Fetch Acerto records for the current motorista and derive pending balance.
// Data is read-only (FR-034) — no write operations are permitted in mobile.
//
// Corporate proxy note (Netscope): All Supabase HTTPS requests go through the
// system proxy automatically via the React Native networking stack. No code
// changes are needed, but the device must trust the proxy CA certificate.
//
// Layer: hooks — may import from lib/ and store/ only; not from components/ or app/

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import type { Acerto } from '@fretagro/types'

// ─────────────────────────────────────────────────────────────────────────────
// Pending balance shape
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingBalance {
  /** Sum of valorComissao across all acertos with status=pendente (centavos) */
  valorComissao: number
  /** Sum of totalDeducoes across all acertos with status=pendente (centavos) */
  totalDeducoes: number
  /** Sum of saldoFinal across all acertos with status=pendente (centavos) */
  saldoFinal: number
}

/**
 * A concluded frete with no acerto record yet.
 * saldoEstimado = Math.round(valorBruto * percentualComissao / 100) − deducoesEstimadas
 */
export interface FreteAguardando {
  id: string
  origem: string
  destino: string
  dataFim?: string
  valorBruto: number
  /** Gross commission estimate (centavos) */
  comissaoBruta: number
  /** Sum of lancamentos.deducaoAcerto=true for this frete (centavos) */
  deducoesEstimadas: number
  /** Net balance estimate: comissaoBruta − deducoesEstimadas (centavos) */
  saldoEstimado: number
}

export interface AcertoState {
  /**
   * Aggregated total a receber — combines exact pendente acertos + estimated
   * values from concluded fretes awaiting acerto.
   */
  pendingBalance: PendingBalance
  /** Individual open (pendente) acertos — value confirmed by fleet owner, payment pending */
  pendingAcertos: Acerto[]
  /** Concluded fretes with no acerto yet — estimated value calculated client-side */
  awaitingAcertos: FreteAguardando[]
  /** All settled (realizado) acertos — shown as history */
  acertoHistory: Acerto[]
  loading: boolean
  error: string | null
}

const ZERO_BALANCE: PendingBalance = {
  valorComissao: 0,
  totalDeducoes: 0,
  saldoFinal: 0,
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAcerto(): AcertoState {
  const [acertoHistory, setAcertoHistory] = useState<Acerto[]>([])
  const [pendingAcertos, setPendingAcertos] = useState<Acerto[]>([])
  const [awaitingAcertos, setAwaitingAcertos] = useState<FreteAguardando[]>([])
  const [pendingBalance, setPendingBalance] = useState<PendingBalance>(ZERO_BALANCE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAcertos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Resolve current motorista ID from the active session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session) {
        setLoading(false)
        return
      }

      // Resolve the Motorista record id from the Supabase Auth user id.
      // acertos.motoristaId references Motorista.id (a cuid), NOT the auth
      // user id — so we must look it up via supabaseUserId first.
      // percentualComissao is needed to estimate commission for awaiting fretes.
      const { data: motorista, error: motoristaError } = await supabase
        .from('motoristas')
        .select('id, percentualComissao')
        .eq('supabaseUserId', session.user.id)
        .single()

      if (motoristaError) throw motoristaError
      if (!motorista) {
        setLoading(false)
        return
      }

      const motoristaId = motorista.id

      // Fetch acertos (critical — pending balance + history).
      const { data, error: fetchError } = await supabase
        .from('acertos')
        .select(
          'id, valorFrete, percentualComissao, valorComissao, totalDeducoes, saldoFinal, status, comprovanteUrl, freteId, motoristaId, createdAt, realizadoEm',
        )
        .eq('motoristaId', motoristaId)
        .order('createdAt', { ascending: false })

      if (fetchError) throw fetchError

      const rows = (data ?? []) as Acerto[]

      // Derive pending balance — sum of all status=pendente acertos (exact values)
      const pending = rows.filter((a) => a.status === 'pendente')
      const pendingTotals: PendingBalance = pending.reduce(
        (acc, a) => ({
          valorComissao: acc.valorComissao + a.valorComissao,
          totalDeducoes: acc.totalDeducoes + a.totalDeducoes,
          saldoFinal: acc.saldoFinal + a.saldoFinal,
        }),
        { ...ZERO_BALANCE },
      )

      // Fetch concluded fretes without acerto (best-effort — never block the
      // pending acertos above if this query fails, e.g. due to RLS / PostgREST
      // embed limitations). These are "aguardando acerto" from the fleet owner.
      let awaitingList: FreteAguardando[] = []
      try {
        const { data: concludedData, error: concludedError } = await supabase
          .from('fretes')
          // Include lancamentos so we can calculate deductions client-side
          .select('id, origem, destino, valorBruto, dataFim, lancamentos(valor, deducaoAcerto)')
          .eq('motoristaId', motoristaId)
          .eq('status', 'concluido')
          .order('dataFim', { ascending: false })

        if (concludedError) throw concludedError

        // Calculate estimated commission for each concluded frete (no acerto yet).
        // Formula mirrors calcularAcerto on the server side:
        //   comissaoBruta = Math.round(valorBruto * percentualComissao / 100)
        //   deducoes      = Σ lancamentos where deducaoAcerto = true
        //   saldoEstimado = comissaoBruta − deducoes
        type RawFrete = {
          id: string
          origem: string
          destino: string
          valorBruto: number
          dataFim?: string | null
          lancamentos?: Array<{ valor: number; deducaoAcerto: boolean }> | null
        }
        awaitingList = (concludedData as RawFrete[] ?? []).map((frete) => {
          const lancamentos = frete.lancamentos ?? []
          const deducoesEstimadas = lancamentos
            .filter((l) => l.deducaoAcerto)
            .reduce((sum, l) => sum + l.valor, 0)
          const comissaoBruta = Math.round(frete.valorBruto * motorista.percentualComissao / 100)
          const saldoEstimado = comissaoBruta - deducoesEstimadas
          return {
            id: frete.id,
            origem: frete.origem,
            destino: frete.destino,
            dataFim: frete.dataFim ?? undefined,
            valorBruto: frete.valorBruto,
            comissaoBruta,
            deducoesEstimadas,
            saldoEstimado,
          }
        })
      } catch {
        // Awaiting-acerto data is supplementary; ignore failures silently.
        awaitingList = []
      }

      // Combine: exact pendente values + estimated awaiting values
      const awaitingTotals: PendingBalance = awaitingList.reduce(
        (acc, f) => ({
          valorComissao: acc.valorComissao + f.comissaoBruta,
          totalDeducoes: acc.totalDeducoes + f.deducoesEstimadas,
          saldoFinal: acc.saldoFinal + f.saldoEstimado,
        }),
        { ...ZERO_BALANCE },
      )

      const balance: PendingBalance = {
        valorComissao: pendingTotals.valorComissao + awaitingTotals.valorComissao,
        totalDeducoes: pendingTotals.totalDeducoes + awaitingTotals.totalDeducoes,
        saldoFinal:    pendingTotals.saldoFinal    + awaitingTotals.saldoFinal,
      }

      // History = settled acertos only
      const history = rows.filter((a) => a.status === 'realizado')

      setPendingBalance(balance)
      setPendingAcertos(pending)
      setAcertoHistory(history)
      setAwaitingAcertos(awaitingList)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar acertos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAcertos()
  }, [fetchAcertos])

  return { pendingBalance, pendingAcertos, awaitingAcertos, acertoHistory, loading, error }
}
