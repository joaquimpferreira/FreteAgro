// components/frota/CaminhaoStatsPanel.tsx — Per-truck analytics for /frota/[id]
// "use client" — fetches aggregate stats via useCaminhaoStats and renders KPI cards + gauge.

'use client'

import { Fuel } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { MetricTrendCard } from '@/components/dashboard/MetricTrendCard'
import { ConsumoGauge } from '@/components/shared/ConsumoGauge'
import { useCaminhaoStats } from '@/hooks/useFrotaStats'
import { formatMoeda } from '@/lib/finance/formatMoeda'

const SUBTIPO_LABELS: Record<string, string> = {
  diesel: 'Diesel',
  arla: 'Arla',
}

function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`
}

interface CaminhaoStatsPanelProps {
  caminhaoId: string
}

export function CaminhaoStatsPanel({ caminhaoId }: CaminhaoStatsPanelProps) {
  const { data, loading } = useCaminhaoStats(caminhaoId)

  if (loading || !data) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const semDados =
    data.fretesRealizados === 0 && data.kmRodadoTotal === 0 && data.ultimosAbastecimentos.length === 0

  if (semDados) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4 py-8 text-sm text-muted-foreground">
          Ainda não há fretes concluídos ou abastecimentos registrados para este caminhão.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPIs do caminhão ──────────────────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTrendCard
          label="Fretes Realizados"
          value={String(data.fretesRealizados)}
          data={[]}
        />
        <MetricTrendCard
          label="Receita Gerada"
          value={formatMoeda(data.receitaGerada)}
          data={[]}
        />
        <MetricTrendCard
          label="Despesas"
          value={formatMoeda(data.despesasTotais)}
          data={[]}
        />
        <MetricTrendCard
          label="Km Rodado"
          value={formatKm(data.kmRodadoTotal)}
          description="Últimos 6 meses"
          data={data.kmPorMes.map((m) => ({ label: m.mes, value: m.valor }))}
          format="numero"
        />
      </div>

      {/* ── Consumo | Abastecimentos ──────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Consumo Médio</CardTitle>
            <CardDescription>Diesel · km/l</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-4 pt-0">
            <ConsumoGauge value={data.mediaConsumo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Últimos Abastecimentos
            </CardTitle>
            <CardDescription>Diesel e arla registrados via app</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {data.ultimosAbastecimentos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum abastecimento registrado ainda.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {data.ultimosAbastecimentos.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {SUBTIPO_LABELS[a.subtipo] ?? a.subtipo}
                        {a.local && <span className="font-normal text-muted-foreground"> · {a.local}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.data).toLocaleDateString('pt-BR')} · {a.litros.toFixed(1)} L
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums font-medium text-foreground">
                      {formatMoeda(a.valorTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
