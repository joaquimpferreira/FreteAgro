// hooks/useAcertos.ts — data hook for settlement management (US4)
// "use client" — hooks run in React client components only.
// Layer: hooks — may import from types/ and lib/ only.

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Acerto } from '@/types/acerto'
import type { PaginatedResponse } from '@/lib/api/pagination'

// ─── Filter options ───────────────────────────────────────────────────────────

export interface AcertosFilterOptions {
  motoristaId?: string // pass 'me' for driver's own settlements
  status?: 'pendente' | 'realizado'
  page?: number
  pageSize?: number
}

export interface AcertoDetalhe extends Acerto {
  motorista: {
    id: string
    nome: string
    percentualComissao: number
    whatsapp?: string
  }
  frete: {
    id: string
    origem: string
    destino: string
    tipoCarga: string
    dataInicio: string
    dataFim: string | null
    valorBruto: number
    lancamentos?: Array<{
      id: string
      tipo: string
      descricao: string | null
      valor: number
    }>
  }
}

// ─── useAcertos ───────────────────────────────────────────────────────────────

export function useAcertos(options: AcertosFilterOptions = {}) {
  const { motoristaId, status, page = 1, pageSize = 20 } = options

  const [data, setData]       = useState<PaginatedResponse<AcertoDetalhe> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchAcertos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (motoristaId) params.set('motoristaId', motoristaId)
      if (status)      params.set('status', status)

      const res = await window.fetch(`/api/acertos?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar acertos.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [motoristaId, status, page, pageSize])

  useEffect(() => { fetchAcertos() }, [fetchAcertos])

  /** Open a new settlement for a concluded freight */
  const openAcerto = useCallback(async (freteId: string): Promise<AcertoDetalhe> => {
    const res = await window.fetch('/api/acertos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ freteId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao abrir acerto.')
    }
    const created: AcertoDetalhe = await res.json()
    await fetchAcertos()
    return created
  }, [fetchAcertos])

  /** Confirm payment (advance to realizado) */
  const confirmAcerto = useCallback(async (id: string): Promise<AcertoDetalhe> => {
    const res = await window.fetch(`/api/acertos/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'realizado' }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao confirmar acerto.')
    }
    const updated: AcertoDetalhe = await res.json()
    await fetchAcertos()
    return updated
  }, [fetchAcertos])

  /** Generate the PDF receipt and return the URL */
  const gerarComprovante = useCallback(async (id: string): Promise<string> => {
    const res = await window.fetch(`/api/acertos/${id}/comprovante`, {
      method: 'POST',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao gerar comprovante.')
    }
    const { comprovanteUrl } = await res.json()
    await fetchAcertos()
    return comprovanteUrl as string
  }, [fetchAcertos])

  return {
    data,
    loading,
    error,
    refresh: fetchAcertos,
    openAcerto,
    confirmAcerto,
    gerarComprovante,
  }
}

// ─── useAcertoDetalhe ─────────────────────────────────────────────────────────

export function useAcertoDetalhe(id: string) {
  const [data, setData]       = useState<AcertoDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchAcerto = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch(`/api/acertos/${id}`)
      if (!res.ok) throw new Error('Erro ao carregar acerto.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAcerto() }, [fetchAcerto])

  return { data, loading, error, refresh: fetchAcerto }
}
