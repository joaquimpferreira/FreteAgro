// components/fretes/FreteStatsPanel.tsx — Per-trip analytics for the frete detail page
// Server Component — chart itself is client-only (Recharts), wrapped internally.
// Derived entirely from the already-fetched frete (no extra request needed —
// unlike fleet analytics, a single trip's numbers don't require aggregating
// across many records).

import { Route } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricTrendCard } from '@/components/dashboard/MetricTrendCard'
import { ConsumoGauge } from '@/components/shared/ConsumoGauge'
import type { TrechoKm, Abastecimento } from '@fretagro/types'

const TIPO_TRECHO_LABELS: Record<string, string> = {
  vazio:     'Vazio',
  carregado: 'Carregado',
}

const TIPO_TRECHO_CLASSES: Record<string, string> = {
  vazio:     'border-grey-600 bg-grey-800 text-grey-300',
  carregado: 'border-success-400/30 bg-success-400/10 text-success-300',
}

function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`
}

interface FreteStatsPanelProps {
  kmInicial: number
  kmFinal?: number | null
  trechos: TrechoKm[]
  abastecimentos: Abastecimento[]
}

export function FreteStatsPanel({ kmInicial, kmFinal, trechos, abastecimentos }: FreteStatsPanelProps) {
  const kmRodadoTrechos = trechos.reduce((s, t) => s + (t.kmRodado ?? 0), 0)
  const kmRodado = trechos.length > 0
    ? kmRodadoTrechos
    : (kmFinal != null ? Math.max(0, kmFinal - kmInicial) : 0)

  const trechosVazio     = trechos.filter((t) => t.tipo === 'vazio').length
  const trechosCarregado = trechos.filter((t) => t.tipo === 'carregado').length

  const litrosDiesel = abastecimentos
    .filter((a) => a.subtipo === 'diesel')
    .reduce((s, a) => s + Number(a.litros), 0)
  const valorCombustivel = abastecimentos.reduce((s, a) => s + a.valorTotal, 0)
  const mediaConsumo = litrosDiesel > 0 && kmRodado > 0 ? kmRodado / litrosDiesel : null

  const semDados = trechos.length === 0 && kmFinal == null && abastecimentos.length === 0

  if (semDados) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4 py-8 text-sm text-muted-foreground">
          Ainda não há trechos ou abastecimentos registrados nesta viagem.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPIs da viagem ────────────────────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTrendCard
          label="Km Rodado"
          value={formatKm(kmRodado)}
          description={trechos.length > 0 ? `${trechos.length} trechos registrados` : 'KM inicial e final'}
          data={[]}
        />
        <MetricTrendCard
          label="Trechos"
          value={String(trechos.length)}
          description={`${trechosVazio} vazio · ${trechosCarregado} carregado`}
          data={[]}
        />
        <MetricTrendCard
          label="Litros Abastecidos"
          value={`${litrosDiesel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L`}
          description="Diesel nesta viagem"
          data={[]}
        />
        <MetricTrendCard
          label="Gasto Combustível"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCombustivel / 100)}
          description={`${abastecimentos.length} abastecimento${abastecimentos.length !== 1 ? 's' : ''}`}
          data={[]}
        />
      </div>

      {/* ── Consumo | Trechos ─────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Consumo da Viagem</CardTitle>
            <CardDescription>Diesel · km/l</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-4 pt-0">
            <ConsumoGauge value={mediaConsumo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Trechos
            </CardTitle>
            <CardDescription>Pernas vazias e carregadas da viagem</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {trechos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum trecho registrado — o app do motorista grava a quilometragem por perna da viagem.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {trechos.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant="outline" className={TIPO_TRECHO_CLASSES[t.tipo]}>
                        {TIPO_TRECHO_LABELS[t.tipo] ?? t.tipo}
                      </Badge>
                      <span className="truncate text-muted-foreground">
                        {t.kmInicial} → {t.kmFinal ?? '—'}
                      </span>
                    </div>
                    <span className="shrink-0 tabular-nums font-medium text-foreground">
                      {t.kmRodado != null ? formatKm(t.kmRodado) : 'Em andamento'}
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
