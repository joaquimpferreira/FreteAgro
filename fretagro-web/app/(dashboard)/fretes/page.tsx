// app/(dashboard)/fretes/page.tsx — Freight list page with filters
// "use client" — manages filter state and list interactions

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FreteCard } from '@/components/fretes/FreteCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PeriodSelector, type PeriodOption, type DateRange } from '@/components/shared/PeriodSelector'
import { useFretes } from '@/hooks/useFretes'
import type { Frete } from '@/types/frete'

const STATUS_OPTIONS = [
  { value: '',                label: 'Todos' },
  { value: 'em_andamento',    label: 'Em andamento' },
  { value: 'concluido',       label: 'Concluídos' },
  { value: 'acerto_pendente', label: 'Acerto pendente' },
]

export default function FretesPage() {
  const [statusFilter, setStatusFilter]   = useState('')
  const [fromFilter, setFromFilter]       = useState('')
  const [toFilter, setToFilter]           = useState('')
  const [rotaFilter, setRotaFilter]       = useState('')
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)

  const { data, loading, deleteFrete } = useFretes({
    status: statusFilter || undefined,
    from:   fromFilter   || undefined,
    to:     toFilter     || undefined,
    rota:   rotaFilter   || undefined,
  })

  async function handleDelete(frete: Frete) {
    if (!confirm(`Excluir frete ${frete.origem} → ${frete.destino}? Se houver despesas ou acerto, o frete será inativado.`)) return
    setErrorMsg(null)
    try {
      await deleteFrete(frete.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao excluir frete.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fretes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registros de transporte da frota</p>
        </div>
        <Button asChild>
          <Link href="/fretes/novo">
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Novo frete
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
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

        {/* Rota search */}
        <input
          type="text"
          placeholder="Buscar por rota…"
          value={rotaFilter}
          onChange={(e) => setRotaFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />

        {/* Period */}
        <PeriodSelector
          onChange={(_period: PeriodOption, range: DateRange) => { setFromFilter(range.from); setToFilter(range.to) }}
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* Count */}
      {data && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{data.pagination.total} frete{data.pagination.total !== 1 ? 's' : ''}</Badge>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !data?.data.length ? (
        <EmptyState
          title="Nenhum frete encontrado"
          description="Registre o primeiro frete para começar o controle financeiro."
          action={
            <Button asChild>
              <Link href="/fretes/novo">
                <Plus className="h-4 w-4 mr-1" />
                Novo frete
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((frete) => (
            <FreteCard key={frete.id} frete={frete} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
