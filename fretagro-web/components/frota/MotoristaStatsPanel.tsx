// components/frota/MotoristaStatsPanel.tsx — Per-driver analytics for /frota/motoristas/[id]
// "use client" — fetches aggregate stats via useMotoristaStats and renders KPI cards + acertos.

'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { MetricTrendCard } from '@/components/dashboard/MetricTrendCard'
import { useMotoristaStats } from '@/hooks/useFrotaStats'
import { formatMoeda } from '@/lib/finance/formatMoeda'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  realizado: 'Realizado',
}

const STATUS_CLASSES: Record<string, string> = {
  pendente: 'border-warning-400/30 bg-warning-400/10 text-warning-300',
  realizado: 'border-success-400/30 bg-success-400/10 text-success-300',
}

interface MotoristaStatsPanelProps {
  motoristaId: string
}

export function MotoristaStatsPanel({ motoristaId }: MotoristaStatsPanelProps) {
  const { data, loading } = useMotoristaStats(motoristaId)

  if (loading || !data) {
    return (
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const semDados = data.fretesRealizados === 0 && data.ultimosAcertos.length === 0

  if (semDados) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4 py-8 text-sm text-muted-foreground">
          Ainda não há fretes ou acertos registrados para este motorista.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPIs do motorista ─────────────────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTrendCard
          label="Fretes Realizados"
          value={String(data.fretesRealizados)}
          data={[]}
        />
        <MetricTrendCard
          label="Comissão Total"
          value={formatMoeda(data.totalComissao)}
          description="Acertos realizados"
          data={data.comissaoPorMes.map((m) => ({ label: m.mes, value: m.valor }))}
          format="moeda"
        />
        <MetricTrendCard
          label="Saldo Recebido"
          value={formatMoeda(data.saldoTotal)}
          description={`${formatMoeda(data.totalDeducoes)} em deduções`}
          data={[]}
        />
        <MetricTrendCard
          label="Acertos Pendentes"
          value={String(data.acertosPendentes)}
          href="/acertos"
          data={[]}
        />
      </div>

      {/* ── Últimos acertos ───────────────────────────────────── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Últimos Acertos
          </CardTitle>
          <CardDescription>Comissão e saldo por frete</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {data.ultimosAcertos.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum acerto registrado ainda.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {data.ultimosAcertos.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      href={`/fretes/${a.freteId}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      Comissão {formatMoeda(a.valorComissao)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.data).toLocaleDateString('pt-BR')} · Saldo {formatMoeda(a.saldoFinal)}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_CLASSES[a.status]}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
