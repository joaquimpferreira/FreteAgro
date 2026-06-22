// components/acertos/DeducaoForm.tsx — lists deductions for a frete (read-only in settlement view)
// "use client" — renders interactive list

'use client'

import { formatMoeda } from '@/lib/finance/formatMoeda'

const TIPO_LABELS: Record<string, string> = {
  combustivel: 'Combustível',
  borracharia:  'Borracharia',
  patio:        'Pátio',
  pedagio:      'Pedágio',
  oficina:      'Oficina',
  vale:         'Vale',
  adiantamento: 'Adiantamento',
  salario:      'Salário',
  ipva:         'IPVA',
  seguro:       'Seguro',
  outro:        'Outro',
}

export interface DeducaoItem {
  id: string
  tipo: string
  descricao: string | null
  valor: number // centavos
}

interface DeducaoFormProps {
  deducoes: DeducaoItem[]
  emptyMessage?: string
}

export function DeducaoForm({ deducoes, emptyMessage = 'Nenhuma dedução para este frete.' }: DeducaoFormProps) {
  if (deducoes.length === 0) {
    return (
      <p className="text-p-sm text-grey-500 py-2">{emptyMessage}</p>
    )
  }

  return (
    <ul className="flex flex-col gap-2" role="list" aria-label="Deduções do acerto">
      {deducoes.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between rounded-input bg-surface-elevated px-3 py-2"
        >
          <div>
            <p className="text-p-sm font-medium text-grey-100">
              {TIPO_LABELS[d.tipo] ?? d.tipo}
            </p>
            {d.descricao && (
              <p className="text-caption text-grey-400">{d.descricao}</p>
            )}
          </div>
          <span className="text-p-sm font-semibold text-brand-orange">
            ({formatMoeda(d.valor)})
          </span>
        </li>
      ))}
    </ul>
  )
}
