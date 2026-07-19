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

export interface AcertoState {
  /** Aggregated pending balance across all open (pendente) acertos */
  pendingBalance: PendingBalance
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

      const motoristaId = session.user.id

      // Fetch all acertos for this motorista
      const { data, error: fetchError } = await supabase
        .from('acertos')
        .select(
          'id, valorFrete, percentualComissao, valorComissao, totalDeducoes, saldoFinal, status, comprovanteUrl, freteId, motoristaId, createdAt, realizadoEm',
        )
        .eq('motoristaId', motoristaId)
        .order('createdAt', { ascending: false })

      if (fetchError) throw fetchError

      const rows = (data ?? []) as Acerto[]

      // Derive pending balance — sum of all status=pendente acertos
      const pending = rows.filter((a) => a.status === 'pendente')
      const balance: PendingBalance = pending.reduce(
        (acc, a) => ({
          valorComissao: acc.valorComissao + a.valorComissao,
          totalDeducoes: acc.totalDeducoes + a.totalDeducoes,
          saldoFinal: acc.saldoFinal + a.saldoFinal,
        }),
        { ...ZERO_BALANCE },
      )

      // History = settled acertos only
      const history = rows.filter((a) => a.status === 'realizado')

      setPendingBalance(balance)
      setAcertoHistory(history)
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

  return { pendingBalance, acertoHistory, loading, error }
}
