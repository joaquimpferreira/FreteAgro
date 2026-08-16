// components/dashboard/ReceitaDespesaChart.tsx — Monthly revenue vs expense area chart (US6, FR-034)
// "use client" — Recharts requires a browser context.
// Renders a shadcn-styled area chart (receita vs despesa) by month.

'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface ReceitaDespesaMes {
  mes: string
  receita: number
  despesa: number
}

interface ReceitaDespesaChartProps {
  data: ReceitaDespesaMes[]
}

const chartConfig = {
  receita: {
    label: 'Receita',
    color: 'hsl(var(--chart-1))',
  },
  despesa: {
    label: 'Despesa',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function formatReaisShort(centavos: number): string {
  const reais = centavos / 100
  if (reais >= 1_000_000) return `R$${(reais / 1_000_000).toFixed(1)}M`
  if (reais >= 1_000) return `R$${(reais / 1_000).toFixed(0)}k`
  return `R$${reais.toFixed(0)}`
}

export function ReceitaDespesaChart({ data }: ReceitaDespesaChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[190px] items-center justify-center text-sm text-muted-foreground">
        Sem dados no período selecionado.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    mesLabel: formatMesLabel(d.mes),
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[160px] w-full">
      <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="fillReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-receita)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-receita)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillDespesa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-despesa)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-despesa)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="mesLabel"
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          tickFormatter={formatReaisShort}
          axisLine={false}
          tickLine={false}
          tickMargin={4}
          width={56}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <ChartTooltip
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              formatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format((value as number) / 100)
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="var(--color-receita)"
          strokeWidth={2.5}
          fill="url(#fillReceita)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="despesa"
          stroke="var(--color-despesa)"
          strokeWidth={2.5}
          fill="url(#fillDespesa)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

