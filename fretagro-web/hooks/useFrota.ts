// hooks/useFrota.ts — data hook for fleet management (trucks + drivers)
// "use client" — hooks run in React client components only.
// Fetches and mutates caminhões / motoristas via the REST API.
// Layer: hooks — may import from types/ and lib/ only.

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Caminhao, Motorista, CaminhaoCreateInput, CaminhaoUpdateInput, MotoristaCreateInput } from '@/types/frota'
import type { PaginatedResponse } from '@/lib/api/pagination'

// ─── Trucks ───────────────────────────────────────────────────────────────────

interface UseCaminhoesOptions {
  status?: 'ativo' | 'inativo'
  semMotorista?: boolean
  page?: number
  pageSize?: number
}

export function useCaminhoes(options: UseCaminhoesOptions = {}) {
  const { status, semMotorista, page = 1, pageSize = 20 } = options

  const [data, setData]       = useState<PaginatedResponse<Caminhao> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (status) params.set('status', status)
      if (semMotorista) params.set('semMotorista', 'true')

      const res = await window.fetch(`/api/caminhoes?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar caminhões.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [status, semMotorista, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  const createCaminhao = useCallback(async (input: CaminhaoCreateInput): Promise<Caminhao> => {
    const res = await window.fetch('/api/caminhoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao criar caminhão.')
    }
    const created: Caminhao = await res.json()
    await fetch()
    return created
  }, [fetch])

  const updateCaminhao = useCallback(async (id: string, input: CaminhaoUpdateInput): Promise<Caminhao> => {
    const res = await window.fetch(`/api/caminhoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao atualizar caminhão.')
    }
    const updated: Caminhao = await res.json()
    await fetch()
    return updated
  }, [fetch])

  const deleteCaminhao = useCallback(async (id: string): Promise<void> => {
    const res = await window.fetch(`/api/caminhoes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao inativar caminhão.')
    }
    await fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch, createCaminhao, updateCaminhao, deleteCaminhao }
}

// ─── Drivers ──────────────────────────────────────────────────────────────────

interface UseMotoristasOptions {
  status?: 'ativo' | 'inativo'
  page?: number
  pageSize?: number
}

export function useMotoristas(options: UseMotoristasOptions = {}) {
  const { status, page = 1, pageSize = 20 } = options

  const [data, setData]       = useState<PaginatedResponse<Motorista> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (status) params.set('status', status)

      const res = await window.fetch(`/api/motoristas?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar motoristas.')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }, [status, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  const createMotorista = useCallback(async (input: MotoristaCreateInput): Promise<Motorista> => {
    const res = await window.fetch('/api/motoristas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao criar motorista.')
    }
    const created: Motorista = await res.json()
    await fetch()
    return created
  }, [fetch])

  const updateMotorista = useCallback(async (
    id: string,
    input: Partial<MotoristaCreateInput>,
  ): Promise<Motorista> => {
    const res = await window.fetch(`/api/motoristas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao atualizar motorista.')
    }
    const updated: Motorista = await res.json()
    await fetch()
    return updated
  }, [fetch])

  const deleteMotorista = useCallback(async (id: string): Promise<void> => {
    const res = await window.fetch(`/api/motoristas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao inativar motorista.')
    }
    await fetch()
  }, [fetch])

  const resendInvite = useCallback(async (id: string): Promise<void> => {
    const res = await window.fetch(`/api/motoristas/${id}/convite`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Erro ao reenviar convite.')
    }
  }, [])

  return { data, loading, error, refetch: fetch, createMotorista, updateMotorista, deleteMotorista, resendInvite }
}
