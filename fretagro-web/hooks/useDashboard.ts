// hooks/useDashboard.ts — data hook for dashboard KPIs and chart data (US6)
// "use client" — hooks run in React client components only.
// Layer: hooks — may import from types/ and lib/ only.

'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types mirroring lib/dashboard/aggregates.ts ─────────────────────────────

export type PeriodPreset =
  | 'este_mes'
  | 'mes_passado'
  | 'ultimos_3_meses'
  | 'este_ano'
  | 'personalizado'

export interface DashboardKpis {
  receitaBruta: number
  totalFretes: number
  despesasTotais: number
  lucroLiquido: number
}

export interface DashboardAlertas {
  acertosPendentes: number
  caminhoesSemMotorista: number
}

export interface ReceitaDespesaMes {
  mes: string
  receita: number
  despesa: number
}

export interface DespesaCategoria {
  categoria: string
  total: number
  percentual: number
}

export interface FretesRecentesItem {
  id: string
  origem: string
  destino: string
  status: string
  valorBruto: number
  dataInicio: string
  motoristaNome: string | null
  caminhaoPlaca: string
}

export interface DashboardData {
  kpis: DashboardKpis
  alertas: DashboardAlertas
  receitaDespesaPorMes: ReceitaDespesaMes[]
  despesasPorCategoria: DespesaCategoria[]
  fretesRecentes: FretesRecentesItem[]
}

export interface DashboardFilterOptions {
  periodo: PeriodPreset
  from?: string
  to?: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard(options: DashboardFilterOptions) {
  const { periodo, from, to } = options

  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ periodo })
      if (from) params.set('from', from)
      if (to)   params.set('to', to)

      const res = await window.fetch(`/api/relatorios/dashboard?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Erro ao carregar dashboard.')
      }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [periodo, from, to])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  return { data, loading, error, refetch: fetchDashboard }
}
