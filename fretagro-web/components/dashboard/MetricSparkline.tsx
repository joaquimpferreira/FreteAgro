// components/dashboard/MetricSparkline.tsx — Inline trend chart for MetricTrendCard
// "use client" — Recharts requires a browser context.

'use client'

import { Area, AreaChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatMoeda } from '@/lib/finance/formatMoeda'

export interface SparklinePoint {
  label: string
  value: number
}

interface MetricSparklineProps {
  data: SparklinePoint[]
  direction: 'up' | 'down' | 'neutral'
  /** Serializable formatting hint — functions can't cross the Server→Client boundary as props. */
  format?: 'moeda' | 'numero'
}

const COLOR_VAR: Record<MetricSparklineProps['direction'], string> = {
  up: 'hsl(var(--chart-1))',
  down: 'hsl(var(--chart-4))',
  neutral: 'hsl(var(--chart-3))',
}

export function MetricSparkline({ data, direction, format }: MetricSparklineProps) {
  const color = COLOR_VAR[direction]
  const formatValue = format === 'moeda' ? formatMoeda : (v: number) => v.toLocaleString('pt-BR')
  const chartConfig = {
    value: { label: '', color },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="h-10 w-full">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`fillSparkline-${direction}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(v) => formatValue(v as number)}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill={`url(#fillSparkline-${direction})`}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
