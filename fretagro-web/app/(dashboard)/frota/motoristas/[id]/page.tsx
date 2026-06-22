// app/(dashboard)/frota/motoristas/[id]/page.tsx — Motorista detail page
// Shows driver info, bound truck, recent fretes and acertos
// "use client" — data fetching via hooks + fetch

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Truck, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useFretes } from '@/hooks/useFretes'
import type { Motorista } from '@/types/frota'

const CONTRATO_LABELS: Record<string, string> = {
  autonomo: 'Autônomo',
  clt:      'CLT',
}

const STATUS_OPTIONS = [
  { value: '',             label: 'Todos' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido',    label: 'Concluídos' },
]

export default function MotoristaDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [motorista, setMotorista]     = useState<Motorista | null>(null)
  const [loadingDriver, setLoading]   = useState(true)
  const [driverError, setDriverError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: fretesData, loading: fretesLoading } = useFretes({
    motoristaId: id,
    status: statusFilter || undefined,
  })

  const fetchMotorista = useCallback(async () => {
    setLoading(true)
    setDriverError(null)
    try {
      const res = await fetch(`/api/motoristas/${id}`)
      if (!res.ok) throw new Error('Motorista não encontrado.')
      setMotorista(await res.json())
    } catch (err) {
      setDriverError(err instanceof Error ? err.message : 'Erro ao carregar motorista.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchMotorista() }, [fetchMotorista])

  if (loadingDriver) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  if (driverError || !motorista) return (
    <div className="flex flex-col gap-6">
      <Link href="/frota" className="flex items-center gap-1 text-p-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Frota
      </Link>
      <p className="text-sm text-destructive">{driverError ?? 'Motorista não encontrado.'}</p>
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

      {/* Motorista info card */}
      <div className="rounded-card border border-grey-700 bg-surface-card p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-grey-800">
              <User className="h-6 w-6 text-grey-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{motorista.nome}</h1>
              <a
                href={`https://wa.me/${motorista.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {motorista.whatsapp}
              </a>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant="outline"
              className={motorista.status === 'ativo'
                ? 'border-success-400/40 bg-success-400/10 text-success-300'
                : undefined}
            >
              {motorista.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
            {!motorista.appAtivado && (
              <Badge variant="outline" className="border-warning-400/40 bg-warning-400/10 text-warning-300">
                App pendente
              </Badge>
            )}
          </div>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{motorista.percentualComissao}% comissão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{CONTRATO_LABELS[motorista.tipoContrato] ?? motorista.tipoContrato}</span>
          </div>
          {motorista.cpf && (
            <div>
              <span>CPF: {motorista.cpf}</span>
            </div>
          )}
        </div>

        {/* Bound truck */}
        {motorista.caminhao ? (
          <Link
            href={`/frota/${motorista.caminhao.id}`}
            className="flex items-center gap-2 rounded-input border border-grey-700 bg-surface-elevated px-3 py-2.5 transition-colors hover:border-grey-600"
          >
            <Truck className="h-4 w-4 text-primary-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{motorista.caminhao.placa}</p>
              <p className="text-xs text-muted-foreground">{motorista.caminhao.modelo}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 rounded-input border border-warning-400/30 bg-warning-400/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-warning-400 shrink-0" aria-hidden="true" />
            <p className="text-sm text-warning-300">Sem caminhão vinculado</p>
          </div>
        )}
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
            description="Fretes atribuídos a este motorista aparecerão aqui."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {fretesData.data.map((frete) => (
              <Link
                key={frete.id}
                href={`/fretes/${frete.id}`}
                className="group block rounded-card border border-grey-700 bg-surface-card p-4 flex flex-col gap-2 transition-colors hover:border-grey-600 hover:bg-surface-elevated"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {frete.origem} → {frete.destino}
                  </p>
                  <span className={[
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    frete.status === 'em_andamento'    ? 'bg-primary/10 text-primary'       :
                    frete.status === 'concluido'       ? 'bg-success-400/10 text-success-300' :
                    frete.status === 'acerto_realizado' ? 'bg-grey-700 text-grey-300'         :
                    'bg-warning-400/10 text-warning-300',
                  ].join(' ')}>
                    {frete.status === 'em_andamento'     ? 'Em andamento'   :
                     frete.status === 'concluido'        ? 'Concluído'      :
                     frete.status === 'acerto_pendente'  ? 'Acerto pendente':
                     'Realizado'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(frete.dataInicio).toLocaleDateString('pt-BR')}
                  {frete.valorBruto != null && ` · R$ ${Number(frete.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
