// components/dashboard/ComposicaoDespesas.tsx — Expense composition by category (US5, FR-032)
// Displays a ranked list of expense categories with totals and percentage bars.
// Server Component — no interactivity; data passed as props.

import { formatMoeda } from '@/lib/finance/formatMoeda'

// ─── Type labels ─────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  comissao:     'Comissão Motorista',
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

// ─── Colour palette for category bars (cycles if more than 8 categories) ─────

const CATEGORY_COLOURS = [
  'bg-brand-orange',
  'bg-brand-green',
  'bg-blue-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
]

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CategoriaItem {
  categoria: string
  total: number
  percentual: number
}

interface ComposicaoDespesasProps {
  despesasPorCategoria: CategoriaItem[]
  totalDespesas: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComposicaoDespesas({
  despesasPorCategoria,
  totalDespesas,
}: ComposicaoDespesasProps) {
  if (despesasPorCategoria.length === 0) {
    return (
      <div className="rounded-card border border-grey-800 bg-surface p-6">
        <h2 className="text-p-md font-semibold text-grey-200 mb-4">Composição de Despesas</h2>
        <p className="text-p-sm text-grey-500 italic">Nenhuma despesa neste período.</p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-grey-800 bg-surface p-6">
      <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-p-md font-semibold text-grey-200">Composição de Despesas</h2>
        <span className="text-p-sm text-grey-400">
          Total: <span className="font-semibold text-brand-orange">{formatMoeda(totalDespesas)}</span>
        </span>
      </div>

      {/* Visual stacked bar */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full mb-5"
        role="img"
        aria-label="Distribuição de despesas por categoria"
      >
        {despesasPorCategoria.map((cat, idx) => (
          <div
            key={cat.categoria}
            className={CATEGORY_COLOURS[idx % CATEGORY_COLOURS.length]}
            style={{ width: `${cat.percentual}%` }}
            title={`${TIPO_LABELS[cat.categoria] ?? cat.categoria}: ${cat.percentual.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Category legend list */}
      <ul className="flex flex-col gap-3" role="list" aria-label="Categorias de despesas">
        {despesasPorCategoria.map((cat, idx) => (
          <li key={cat.categoria} className="flex items-center gap-3">
            {/* Colour dot */}
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${CATEGORY_COLOURS[idx % CATEGORY_COLOURS.length]}`}
              aria-hidden="true"
            />

            {/* Label + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-p-sm font-medium text-grey-100 truncate">
                  {TIPO_LABELS[cat.categoria] ?? cat.categoria}
                </span>
                <span className="text-p-sm text-grey-400 shrink-0">
                  {cat.percentual.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-grey-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${CATEGORY_COLOURS[idx % CATEGORY_COLOURS.length]}`}
                  style={{ width: `${cat.percentual}%` }}
                />
              </div>
            </div>

            {/* Value */}
            <span className="text-p-sm font-semibold text-brand-orange shrink-0 w-24 text-right">
              {formatMoeda(cat.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
