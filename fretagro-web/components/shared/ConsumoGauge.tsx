// components/shared/ConsumoGauge.tsx — Semi-circle gauge for average fuel consumption (km/l)
// "use client" — Recharts requires a browser context.
// isAnimationActive={false}: RadialBar (like Pie) can get stuck at zero size on first
// mount inside a grid/flex layout — see DespesasDonutChart for the same fix.
// Used by both fleet analytics (per-truck) and per-frete analytics.

'use client'

import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

interface ConsumoGaugeProps {
  value: number | null // km/l
  max?: number
}

const chartConfig = {
  consumo: { label: 'Consumo', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

export function ConsumoGauge({ value, max = 5 }: ConsumoGaugeProps) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0
  const data = [{ name: 'consumo', value: pct, fill: 'hsl(var(--chart-1))' }]

  return (
    <div className="relative flex items-center justify-center">
      <ChartContainer config={chartConfig} className="h-[130px] w-[130px]">
        <RadialBarChart
          data={data}
          startAngle={220}
          endAngle={-40}
          innerRadius="72%"
          outerRadius="100%"
          barSize={11}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{ fill: 'hsl(var(--muted))' }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute flex flex-col items-center">
        <span className="text-xl font-semibold tabular-nums text-foreground">
          {value != null ? value.toFixed(1) : '—'}
        </span>
        <span className="text-xs text-muted-foreground">km/l</span>
      </div>
    </div>
  )
}
