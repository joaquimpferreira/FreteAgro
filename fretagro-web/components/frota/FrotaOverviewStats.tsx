// components/frota/FrotaOverviewStats.tsx — Fleet-wide analytics section for the /frota page
// "use client" — fetches aggregate stats via useFrotaStats and renders KPI cards + ranking.

'use client'

import { Fuel, Gauge, Truck } from 'lucide-react'
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
import { useFrotaStats } from '@/hooks/useFrotaStats'
import { formatMoeda } from '@/lib/finance/formatMoeda'

function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`
}

export function FrotaOverviewStats() {
  const { data, loading } = useFrotaStats()

  if (loading || !data) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const semMotoristaTexto =
    data.caminhoesSemMotorista > 0
      ? `${data.caminhoesInativos} inativos · ${data.caminhoesSemMotorista} sem motorista`
      : `${data.caminhoesInativos} inativos`

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPIs da frota ─────────────────────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTrendCard
          label="Caminhões Ativos"
          value={String(data.caminhoesAtivos)}
          href="#caminhoes-heading"
          description={semMotoristaTexto}
          data={[]}
        />
        <MetricTrendCard
          label="Motoristas Ativos"
          value={String(data.motoristasAtivos)}
          href="#motoristas-heading"
          description={`${data.motoristasInativos} inativos`}
          data={[]}
        />
        <MetricTrendCard
          label="Km Rodado"
          value={formatKm(data.kmRodadoTotal)}
          description="Últimos 6 meses"
          data={data.kmPorMes.map((m) => ({ label: m.mes, value: m.valor }))}
          format="numero"
        />
        <MetricTrendCard
          label="Consumo Médio"
          value={data.mediaConsumo != null ? `${data.mediaConsumo.toFixed(1)} km/l` : '—'}
          description="Frota inteira · diesel"
          data={[]}
        />
      </div>

      {/* ── Combustível | Ranking ─────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Combustível
            </CardTitle>
            <CardDescription>Gasto acumulado</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-4 pt-0">
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatMoeda(data.valorCombustivelTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.litrosDieselTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L de diesel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Ranking de Caminhões
            </CardTitle>
            <CardDescription>Receita gerada nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <RankingBarList
              emptyMessage="Sem dados suficientes no período."
              items={data.topCaminhoes.map((c) => {
                const max = data.topCaminhoes[0].receita || 1
                return {
                  key: c.id,
                  icon: <Truck className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />,
                  label: c.placa,
                  value: `${formatMoeda(c.receita)} · ${formatKm(c.kmRodado)}`,
                  pct: Math.max(4, Math.round((c.receita / max) * 100)),
                }
              })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
