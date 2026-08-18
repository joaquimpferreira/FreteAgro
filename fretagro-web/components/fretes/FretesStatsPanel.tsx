// components/fretes/FretesStatsPanel.tsx — Freight analytics for the /fretes page
// "use client" — fetches aggregate stats via useFretesStats and renders KPI cards + ranking.
// Reacts to the same filters (status, motorista, caminhão, período, rota) as the list below.

'use client'

import { Package } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RankingBarList } from '@/components/shared/RankingBarList'
import { MetricTrendCard } from '@/components/dashboard/MetricTrendCard'
import { useFretesStats, type FretesFilterOptions } from '@/hooks/useFretes'
import { formatMoeda } from '@/lib/finance/formatMoeda'

const TIPO_CARGA_LABELS: Record<string, string> = {
  grao:         'Grão',
  oleo_soja:    'Óleo de soja',
  farelo:       'Farelo',
  fertilizante: 'Fertilizante',
  outro:        'Outro',
}

function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`
}

interface FretesStatsPanelProps {
  filters: FretesFilterOptions
}

export function FretesStatsPanel({ filters }: FretesStatsPanelProps) {
  const { data, loading } = useFretesStats(filters)

  if (loading || !data) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPIs do período/filtro atual ──────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTrendCard
          label="Total de Fretes"
          value={String(data.totalFretes)}
          data={[]}
        />
        <MetricTrendCard
          label="Valor Total"
          value={formatMoeda(data.valorTotal)}
          data={data.valorPorMes.map((m) => ({ label: m.mes, value: m.valor }))}
          format="moeda"
        />
        <MetricTrendCard
          label="Despesas Totais"
          value={formatMoeda(data.despesasTotais)}
          data={[]}
        />
        <MetricTrendCard
          label="Ticket Médio"
          value={formatMoeda(data.ticketMedio)}
          description={`${formatKm(data.kmTotal)} rodados`}
          data={[]}
        />
      </div>

      {/* ── Por tipo de carga ─────────────────────────────────── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Por Tipo de Carga
          </CardTitle>
          <CardDescription>Valor gerado com os filtros atuais</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <RankingBarList
            emptyMessage="Nenhum frete encontrado com os filtros atuais."
            items={data.porTipoCarga.map((t) => {
              const max = data.porTipoCarga[0]?.valor || 1
              return {
                key: t.tipo,
                label: TIPO_CARGA_LABELS[t.tipo] ?? t.tipo,
                value: `${formatMoeda(t.valor)} · ${t.count} frete${t.count !== 1 ? 's' : ''}`,
                pct: Math.max(4, Math.round((t.valor / max) * 100)),
              }
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
