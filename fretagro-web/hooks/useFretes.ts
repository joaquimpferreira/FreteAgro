// hooks/useFretes.ts — data hook for freight management
// "use client" — hooks run in React client components only.
// Layer: hooks — may import from types/ and lib/ only.

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Frete, Lancamento } from '@/types/frete'
import type { PaginatedResponse } from '@/lib/api/pagination'
import type { FreteCreateInput, LancamentoCreateInput } from '@/lib/fretes/schemas'

// ─── Filter options ───────────────────────────────────────────────────────────

export interface FretesFilterOptions {
  status?: string
  motoristaId?: string
  caminhaoId?: string
  from?: string
  to?: string
  rota?: string
  page?: number
  pageSize?: number
}

// ─── useFretes ────────────────────────────────────────────────────────────────

export function useFretes(options: FretesFilterOptions = {}) {
  const { status, motoristaId, caminhaoId, from, to, rota, page = 1, pageSize = 20 } = options

  const [data, setData]       = useState<PaginatedResponse<Frete & { totalDespesas: number }> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchFretes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (status)       params.set('status', status)
      if (motoristaId)  params.set('motoristaId', motoristaId)
      if (caminhaoId)   params.set('caminhaoId', caminhaoId)
      if (from)         params.set('from', from)
      if (to)           params.set('to', to)
      if (rota)         params.set('rota', rota)

      const res = await window.fetch(`/api/fretes?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar fretes.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [status, motoristaId, caminhaoId, from, to, rota, page, pageSize])

  useEffect(() => { fetchFretes() }, [fetchFretes])

  const createFrete = useCallback(async (input: FreteCreateInput): Promise<Frete> => {
    const res = await window.fetch('/api/fretes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao criar frete.')
    }
    const created: Frete = await res.json()
    await fetchFretes()
    return created
  }, [fetchFretes])

  const updateFrete = useCallback(async (
    id: string,
    input: Partial<FreteCreateInput> & { kmFinal?: number; dataFim?: string; status?: string },
  ): Promise<Frete> => {
    const res = await window.fetch(`/api/fretes/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao atualizar frete.')
    }
    const updated: Frete = await res.json()
    await fetchFretes()
    return updated
  }, [fetchFretes])

  const deleteFrete = useCallback(async (id: string): Promise<{ deleted?: boolean; inativado?: boolean }> => {
    const res = await window.fetch(`/api/fretes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao excluir frete.')
    }
    const result = await res.json()
    await fetchFretes()
    return result
  }, [fetchFretes])

  return { data, loading, error, refetch: fetchFretes, createFrete, updateFrete, deleteFrete }
}

// ─── useFreteLancamentos ──────────────────────────────────────────────────────

export interface LancamentosResponse {
  data: Lancamento[]
  totalDespesas: number
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useFreteLancamentos(freteId: string) {
  const [data, setData]       = useState<LancamentosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchLancamentos = useCallback(async () => {
    if (!freteId) return
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch(`/api/fretes/${freteId}/lancamentos`)
      if (!res.ok) throw new Error('Erro ao carregar lançamentos.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [freteId])

  useEffect(() => { fetchLancamentos() }, [fetchLancamentos])

  const addLancamento = useCallback(async (input: LancamentoCreateInput): Promise<Lancamento> => {
    const res = await window.fetch(`/api/fretes/${freteId}/lancamentos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao adicionar lançamento.')
    }
    const created: Lancamento = await res.json()
    await fetchLancamentos()
    return created
  }, [freteId, fetchLancamentos])

  const uploadFoto = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await window.fetch(`/api/fretes/${freteId}/lancamentos/upload`, {
      method: 'POST',
      body:   formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao fazer upload da foto.')
    }
    const { url } = await res.json()
    return url as string
  }, [freteId])

  return { data, loading, error, refetch: fetchLancamentos, addLancamento, uploadFoto }
}
