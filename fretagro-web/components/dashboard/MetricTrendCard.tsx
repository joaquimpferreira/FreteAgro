// components/dashboard/MetricTrendCard.tsx — KPI card with headline value + inline trend sparkline
// Server Component — chart itself is client-only (Recharts), wrapped internally.
// Built on shadcn Chart primitives (components/ui/chart.tsx), same pattern as ReceitaDespesaChart.

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MetricSparkline, type SparklinePoint } from '@/components/dashboard/MetricSparkline'

interface MetricTrendCardProps {
  label: string
  value: string
  href?: string
  description?: string
  sublabel?: string
  /** Chronological series backing the sparkline; also used to derive the trend badge. */
  data: SparklinePoint[]
  /** Formats raw series values in the chart tooltip. Defaults to plain number. */
  format?: 'moeda' | 'numero'
}

const NEUTRAL_PCT = 0.5

function computeTrend(data: SparklinePoint[]) {
  if (data.length < 2) return { pct: 0, direction: 'neutral' as const }
  const first = data[0].value
  const last = data[data.length - 1].value
  const pct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0
  const direction =
    Math.abs(pct) < NEUTRAL_PCT ? 'neutral' as const : pct > 0 ? 'up' as const : 'down' as const
  return { pct, direction }
}

export function MetricTrendCard({
  label,
  value,
  href,
  description,
  sublabel,
  data,
  format,
}: MetricTrendCardProps) {
  const { pct, direction } = computeTrend(data)
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  const trendColor =
    direction === 'up'
      ? 'text-[hsl(var(--chart-1))]'
      : direction === 'down'
        ? 'text-[hsl(var(--chart-4))]'
        : 'text-muted-foreground'

  const caption = [description, sublabel].filter(Boolean).join(' · ')

  const content = (
    <Card className="@container/card flex h-full flex-col gap-0 overflow-hidden bg-gradient-to-t from-primary/5 to-card">
      <CardHeader className="relative shrink-0 space-y-0.5 p-4 pb-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="@[250px]/card:text-2xl text-xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {data.length >= 2 && (
          <div className="absolute right-3 top-3">
            <Badge variant="outline" className={`flex gap-1 rounded-lg text-xs ${trendColor}`}>
              <TrendIcon className="size-3" />
              {pct >= 0 ? '+' : ''}
              {pct.toFixed(1)}%
            </Badge>
          </div>
        )}
      </CardHeader>

      {/* Fixed-height slot — reserved even without a sparkline so cards in the
          same row stay the same height regardless of which ones have trend data. */}
      <div className="h-10 shrink-0">
        {data.length >= 2 && (
          <MetricSparkline data={data} direction={direction} format={format} />
        )}
      </div>

      {caption && (
        <CardFooter className="mt-auto p-4 pt-1 text-xs">
          <div className="line-clamp-1 text-muted-foreground">{caption}</div>
        </CardFooter>
      )}
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}
