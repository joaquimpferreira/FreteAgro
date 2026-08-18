// hooks/useFrotaStats.ts — data hooks for fleet analytics (overview, caminhão, motorista)
// "use client" — hooks run in React client components only.
// Layer: hooks — may import from types/ and lib/ only.

'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  FrotaOverviewStats,
  CaminhaoStats,
  MotoristaStats,
} from '@/lib/fleet/aggregates'

function useStatsFetch<T>(url: string | null) {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch(url)
      if (!res.ok) throw new Error('Erro ao carregar estatísticas.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => { fetchStats() }, [fetchStats])

  return { data, loading, error, refetch: fetchStats }
}

export function useFrotaStats() {
  return useStatsFetch<FrotaOverviewStats>('/api/frota/stats')
}

export function useCaminhaoStats(caminhaoId: string) {
  return useStatsFetch<CaminhaoStats>(caminhaoId ? `/api/caminhoes/${caminhaoId}/stats` : null)
}

export function useMotoristaStats(motoristaId: string) {
  return useStatsFetch<MotoristaStats>(motoristaId ? `/api/motoristas/${motoristaId}/stats` : null)
}
