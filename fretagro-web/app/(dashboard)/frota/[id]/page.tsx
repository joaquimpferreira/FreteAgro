// app/(dashboard)/frota/[id]/page.tsx — Truck detail page
// Shows truck info, bound driver, and all fretes for this truck
// "use client" — data fetching via hooks

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Truck, UserCheck, AlertCircle, Calendar, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { FreteCard } from '@/components/fretes/FreteCard'
import { useFretes } from '@/hooks/useFretes'
import type { Caminhao } from '@/types/frota'

const CARROCERIA_LABELS: Record<string, string> = {
  graneleiro: 'Graneleiro',
  tanque:     'Tanque',
  bau:        'Baú',
  plataforma: 'Plataforma',
  outro:      'Outro',
}

const STATUS_OPTIONS = [
  { value: '',                label: 'Todos' },
  { value: 'em_andamento',    label: 'Em andamento' },
  { value: 'concluido',       label: 'Concluídos' },
  { value: 'acerto_pendente', label: 'Acerto pendente' },
  { value: 'acerto_realizado', label: 'Realizados' },
]

export default function CaminhaoDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [caminhao, setCaminhao]     = useState<Caminhao | null>(null)
  const [loadingTruck, setLoadingTruck] = useState(true)
  const [truckError, setTruckError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: fretesData, loading: fretesLoading } = useFretes({
    caminhaoId: id,
    status: statusFilter || undefined,
  })

  const fetchCaminhao = useCallback(async () => {
    setLoadingTruck(true)
    setTruckError(null)
    try {
      const res = await fetch(`/api/caminhoes/${id}`)
      if (!res.ok) throw new Error('Caminhão não encontrado.')
      setCaminhao(await res.json())
    } catch (err) {
      setTruckError(err instanceof Error ? err.message : 'Erro ao carregar caminhão.')
    } finally {
      setLoadingTruck(false)
    }
  }, [id])

  useEffect(() => { fetchCaminhao() }, [fetchCaminhao])

  if (loadingTruck) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  if (truckError || !caminhao) return (
    <div className="flex flex-col gap-6">
      <Link href="/frota" className="flex items-center gap-1 text-p-sm text-grey-400 hover:text-grey-200 w-fit">
        <ArrowLeft className="h-4 w-4" />
        Frota
      </Link>
      <p className="text-destructive text-sm">{truckError ?? 'Caminhão não encontrado.'}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Back nav */}
      <Link
        href="/frota"
        className="flex items-center gap-1 text-p-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Frota
      </Link>

      {/* Truck info card */}
      <div className="rounded-card border border-grey-700 bg-surface-card p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-grey-800">
              <Truck className="h-6 w-6 text-grey-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{caminhao.placa}</h1>
              <p className="text-sm text-muted-foreground">{caminhao.modelo}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={caminhao.status === 'ativo'
              ? 'border-success-400/40 bg-success-400/10 text-success-300'
              : undefined}
          >
            {caminhao.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {caminhao.ano && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Ano {caminhao.ano}</span>
            </div>
          )}
          {caminhao.carroceria && (
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>{CARROCERIA_LABELS[caminhao.carroceria] ?? caminhao.carroceria}</span>
            </div>
          )}
        </div>

        {/* Driver */}
        {caminhao.motorista ? (
          <div className="flex items-center gap-2 rounded-input border border-grey-700 bg-surface-elevated px-3 py-2.5">
            <UserCheck className="h-4 w-4 text-primary-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{caminhao.motorista.nome}</p>
              <p className="text-xs text-muted-foreground">{caminhao.motorista.whatsapp} · {caminhao.motorista.percentualComissao}% comissão</p>
            </div>
          </div>
        ) : caminhao.status === 'ativo' ? (
          <div className="flex items-center gap-2 rounded-input border border-warning-400/30 bg-warning-400/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-warning-400 shrink-0" aria-hidden="true" />
            <p className="text-sm text-warning-300">Sem motorista vinculado</p>
          </div>
        ) : null}
      </div>

      {/* Fretes section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Fretes</h2>
          {fretesData && (
            <Badge variant="outline">{fretesData.pagination.total}</Badge>
          )}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === opt.value
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {fretesLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !fretesData?.data.length ? (
          <EmptyState
            title="Nenhum frete encontrado"
            description="Fretes criados para este caminhão aparecerão aqui."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {fretesData.data.map((frete) => (
              <FreteCard key={frete.id} frete={frete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
