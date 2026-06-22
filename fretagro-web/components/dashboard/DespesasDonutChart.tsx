// components/dashboard/DespesasDonutChart.tsx — Expense composition donut chart (US6, FR-034)
// "use client" — Recharts requires a browser context.
// Renders a donut/pie chart with expense breakdown by category.

'use client'

import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface DespesaCategoria {
  categoria: string
  total: number
  percentual: number
}

interface DespesasDonutChartProps {
  data: DespesaCategoria[]
}

const TIPO_LABELS: Record<string, string> = {
  comissao:     'Comissão',
  combustivel:  'Combustível',
  borracharia:  'Borracharia',
  patio:        'Pátio',
  pedagio:      'Pedágio',
  oficina:      'Oficina',
  vale:         'Vale',
  adiantamento: 'Adiantamento',
  salario:      'Salário',
  ipva:         'IPVA',
  seguro:       'Seguro',
  manutencao:   'Manutenção',
  outro:        'Outro',
}

// Chart colors using CSS variables (chart-1..5 from globals.css)
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-5))',
]

function buildChartConfig(data: DespesaCategoria[]): ChartConfig {
  return Object.fromEntries(
    data.map((d, i) => [
      d.categoria,
      {
        label: TIPO_LABELS[d.categoria] ?? d.categoria,
        color: CHART_COLORS[i % CHART_COLORS.length],
      },
    ])
  )
}

export function DespesasDonutChart({ data }: DespesasDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Sem despesas no período selecionado.
      </div>
    )
  }

  const chartConfig = buildChartConfig(data)

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={chartConfig} className="mx-auto h-[200px] w-full max-w-[260px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format((value as number) / 100),
                  TIPO_LABELS[String(name)] ?? name,
                ]}
              />
            }
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="total"
            nameKey="categoria"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.categoria}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* Legend */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1">
        {data.slice(0, 6).map((d, i) => (
          <li key={d.categoria} className="flex items-center gap-2 min-w-0">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="truncate text-xs text-muted-foreground">
              {TIPO_LABELS[d.categoria] ?? d.categoria}
            </span>
            <span className="ml-auto shrink-0 text-xs font-medium text-foreground">
              {d.percentual.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
