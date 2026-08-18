// components/acertos/AcertosStatsPanel.tsx — Settlement analytics for the /acertos page
// "use client" — fetches aggregate stats via useAcertosStats and renders KPI cards + ranking.
// Reacts to the same status filter as the list below.

'use client'

import { Clock, Users } from 'lucide-react'
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
import { useAcertosStats } from '@/hooks/useAcertos'
import { formatMoeda } from '@/lib/finance/formatMoeda'

interface AcertosStatsPanelProps {
  status?: 'pendente' | 'realizado'
}

export function AcertosStatsPanel({ status }: AcertosStatsPanelProps) {
  const { data, loading } = useAcertosStats({ status })

  if (loading || !data) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPIs dos acertos ──────────────────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTrendCard
          label="Total de Acertos"
          value={String(data.totalAcertos)}
          data={[]}
        />
        <MetricTrendCard
          label="Pendentes"
          value={String(data.acertosPendentes)}
          description={`${formatMoeda(data.saldoPendente)} a pagar`}
          data={[]}
        />
        <MetricTrendCard
          label="Realizados"
          value={String(data.acertosRealizados)}
          description={`${formatMoeda(data.totalDeducoes)} em deduções`}
          data={[]}
        />
        <MetricTrendCard
          label="Total Pago"
          value={formatMoeda(data.saldoTotal)}
          description="Acertos realizados"
          data={data.saldoPorMes.map((m) => ({ label: m.mes, value: m.valor }))}
          format="moeda"
        />
      </div>

      {/* ── A pagar | Ranking de motoristas ───────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              A Pagar
            </CardTitle>
            <CardDescription>Acertos pendentes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-4 pt-0">
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatMoeda(data.saldoPendente)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.acertosPendentes} acerto{data.acertosPendentes !== 1 ? 's' : ''} aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Ranking de Motoristas
            </CardTitle>
            <CardDescription>Total pago em acertos realizados</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <RankingBarList
              emptyMessage="Nenhum acerto realizado ainda."
              items={data.porMotorista.map((m) => {
                const max = data.porMotorista[0]?.saldoTotal || 1
                return {
                  key: m.motoristaId,
                  label: m.nome,
                  value: `${formatMoeda(m.saldoTotal)} · ${m.count} acerto${m.count !== 1 ? 's' : ''}`,
                  pct: Math.max(4, Math.round((m.saldoTotal / max) * 100)),
                }
              })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
