// app/(dashboard)/fretes/page.tsx — Freight list page with filters
// "use client" — manages filter state and list interactions

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FreteCard } from '@/components/fretes/FreteCard'
import { FretesStatsPanel } from '@/components/fretes/FretesStatsPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PeriodSelector, type PeriodOption, type DateRange } from '@/components/shared/PeriodSelector'
import { useFretes } from '@/hooks/useFretes'
import { useCaminhoes, useMotoristas } from '@/hooks/useFrota'
import type { Frete } from '@/types/frete'

const ALL = 'all'

const STATUS_OPTIONS = [
  { value: '',                label: 'Todos' },
  { value: 'em_andamento',    label: 'Em andamento' },
  { value: 'concluido',       label: 'Concluídos' },
  { value: 'acerto_pendente', label: 'Acerto pendente' },
]

export default function FretesPage() {
  const [statusFilter, setStatusFilter]       = useState('')
  const [fromFilter, setFromFilter]           = useState('')
  const [toFilter, setToFilter]               = useState('')
  const [rotaFilter, setRotaFilter]           = useState('')
  const [caminhaoFilter, setCaminhaoFilter]   = useState('')
  const [motoristaFilter, setMotoristaFilter] = useState('')
  const [errorMsg, setErrorMsg]               = useState<string | null>(null)
  // Bumped on "Limpar filtros" to remount PeriodSelector back to its default display
  const [periodResetKey, setPeriodResetKey]   = useState(0)

  // Full lists (not paginated to 20) to populate the truck/driver filter selects
  const { data: caminhoesData } = useCaminhoes({ pageSize: 100 })
  const { data: motoristasData } = useMotoristas({ pageSize: 100 })

  const filters = {
    status:      statusFilter      || undefined,
    from:        fromFilter        || undefined,
    to:          toFilter          || undefined,
    rota:        rotaFilter        || undefined,
    caminhaoId:  caminhaoFilter    || undefined,
    motoristaId: motoristaFilter   || undefined,
  }

  const { data, loading, deleteFrete } = useFretes(filters)

  const hasActiveFilters = Boolean(
    statusFilter || rotaFilter || caminhaoFilter || motoristaFilter || fromFilter,
  )

  function clearFilters() {
    setStatusFilter('')
    setRotaFilter('')
    setCaminhaoFilter('')
    setMotoristaFilter('')
    setFromFilter('')
    setToFilter('')
    setPeriodResetKey((k) => k + 1)
  }

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
      <div className="flex flex-col gap-3">
        {/* Status — view mode */}
        <div className="flex flex-wrap items-center gap-1.5">
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

        {/* Toolbar — search + refinement filters, grouped in one bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/40 p-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Buscar por rota…"
              value={rotaFilter}
              onChange={(e) => setRotaFilter(e.target.value)}
              className="h-9 pl-8"
              aria-label="Buscar por rota"
            />
          </div>

          <Select value={caminhaoFilter || ALL} onValueChange={(v) => setCaminhaoFilter(v === ALL ? '' : v)}>
            <SelectTrigger className="h-9 w-[150px] shrink-0" aria-label="Filtrar por caminhão">
              <SelectValue placeholder="Caminhão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os caminhões</SelectItem>
              {caminhoesData?.data.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.placa}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={motoristaFilter || ALL} onValueChange={(v) => setMotoristaFilter(v === ALL ? '' : v)}>
            <SelectTrigger className="h-9 w-[150px] shrink-0" aria-label="Filtrar por motorista">
              <SelectValue placeholder="Motorista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os motoristas</SelectItem>
              {motoristasData?.data.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <PeriodSelector
            key={periodResetKey}
            onChange={(_period: PeriodOption, range: DateRange) => { setFromFilter(range.from); setToFilter(range.to) }}
            className="h-9 w-[150px] shrink-0"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* Analytics — reacts to the filters above */}
      <FretesStatsPanel filters={filters} />

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
