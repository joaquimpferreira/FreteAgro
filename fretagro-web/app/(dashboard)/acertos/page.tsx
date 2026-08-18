// app/(dashboard)/acertos/page.tsx — Settlements list with pending alerts
// "use client" — manages filter state and list interactions
// FR-026, FR-028

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { AcertosStatsPanel } from '@/components/acertos/AcertosStatsPanel'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import { useAcertos } from '@/hooks/useAcertos'

const STATUS_OPTIONS = [
  { value: '',          label: 'Todos' },
  { value: 'pendente',  label: 'Pendentes' },
  { value: 'realizado', label: 'Realizados' },
]

const STATUS_LABELS: Record<string, string> = {
  pendente:  'Pendente',
  realizado: 'Realizado',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente:  'secondary',
  realizado: 'default',
}

export default function AcertosPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [errorMsg]                       = useState<string | null>(null)

  const { data, loading, error } = useAcertos({
    status: (statusFilter as 'pendente' | 'realizado') || undefined,
  })

  const pendingCount = data?.data.filter((a) => a.status === 'pendente').length ?? 0

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Acertos</h1>
      <p className="text-sm text-destructive">{error}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Acertos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acertos financeiros com motoristas
          </p>
        </div>
      </div>

      {/* Pending alert — FR-028 */}
      {pendingCount > 0 && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-orange-400/40 bg-orange-400/10 px-4 py-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-orange-400" aria-hidden="true" />
          <p className="text-sm text-orange-300 font-medium">
            {pendingCount === 1
              ? '1 acerto aguardando confirmação de pagamento'
              : `${pendingCount} acertos aguardando confirmação de pagamento`}
          </p>
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
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

      {/* Error */}
      {errorMsg && <p className="text-p-sm text-error">{errorMsg}</p>}

      {/* Analytics — reacts to the status filter above */}
      <AcertosStatsPanel status={(statusFilter as 'pendente' | 'realizado') || undefined} />

      {/* List */}
      {!data || data.data.length === 0 ? (
        <EmptyState
          title="Nenhum acerto encontrado"
          description="Acertos são criados automaticamente ao concluir um frete. Conclua um frete para iniciar o acerto."
        />
      ) : (
        <ul className="flex flex-col gap-3" role="list" aria-label="Lista de acertos">
          {data.data.map((acerto) => (
            <li key={acerto.id}>
              <Link
                href={`/acertos/${acerto.motoristaId}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Driver info */}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">
                    {acerto.motorista.nome}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {acerto.frete.origem} → {acerto.frete.destino}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(acerto.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Values + status */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[acerto.status] ?? 'outline'}>
                    {STATUS_LABELS[acerto.status] ?? acerto.status}
                  </Badge>
                  <p className={`text-sm font-bold ${acerto.saldoFinal >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                    {formatMoeda(acerto.saldoFinal)}
                  </p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination info */}
      {data && data.pagination.totalPages > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Página {data.pagination.page} de {data.pagination.totalPages}
        </p>
      )}
    </div>
  )
}
