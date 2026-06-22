// hooks/useCaixa.ts — data hook for fleet cash-flow management (US5)
// "use client" — hooks run in React client components only.
// Layer: hooks — may import from types/ and lib/ only.

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TipoLancamentoAvulso } from '@/lib/caixa/schemas'

// ─── Response types ───────────────────────────────────────────────────────────

export interface FreteReceitaItem {
  freteId: string
  valor: number
  data: string
}

export interface CategoriaTotal {
  categoria: string
  total: number
  percentual: number
}

export interface ExtratoCaixaResponse {
  periodo: { from: string; to: string }
  receitas: { total: number; itens: FreteReceitaItem[] }
  despesasPorCategoria: CategoriaTotal[]
  totalDespesas: number
  lucroLiquido: number
}

// ─── Input type ───────────────────────────────────────────────────────────────

export interface LancamentoAvulsoInput {
  tipo: TipoLancamentoAvulso
  descricao?: string
  /** Centavos */
  valor: number
  /** YYYY-MM-DD */
  data: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface CaixaFilterOptions {
  from: string
  to: string
}

export function useCaixa(options: CaixaFilterOptions) {
  const { from, to } = options

  const [data, setData]       = useState<ExtratoCaixaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchCaixa = useCallback(async () => {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from, to })
      const res = await window.fetch(`/api/caixa?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Erro ao carregar fluxo de caixa.')
      }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { fetchCaixa() }, [fetchCaixa])

  /**
   * Register a manual avulso outflow (FR-030).
   * Re-fetches the statement on success.
   */
  const addLancamentoAvulso = useCallback(
    async (input: LancamentoAvulsoInput): Promise<void> => {
      const res = await window.fetch('/api/caixa', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Erro ao registrar lançamento.')
      }
      // Refresh statement after successful write
      await fetchCaixa()
    },
    [fetchCaixa],
  )

  return {
    data,
    loading,
    error,
    refetch: fetchCaixa,
    addLancamentoAvulso,
  }
}
