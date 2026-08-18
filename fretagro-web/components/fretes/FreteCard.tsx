// components/fretes/FreteCard.tsx — Freight summary card for list views
// "use client" — action buttons require event handlers

'use client'

import Link from 'next/link'
import { Package, MapPin, Truck, User, Gauge, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import type { Frete } from '@/types/frete'

const TIPO_CARGA_LABELS: Record<string, string> = {
  grao:         'Grão',
  oleo_soja:    'Óleo de soja',
  farelo:       'Farelo',
  fertilizante: 'Fertilizante',
  outro:        'Outro',
}

interface FreteCardProps {
  frete: Frete & { totalDespesas?: number }
  onDelete?: (frete: Frete) => void
}

export function FreteCard({ frete, onDelete }: FreteCardProps) {
  return (
    <Link
      href={`/fretes/${frete.id}`}
      className="group block rounded-card border border-grey-700 bg-surface-card p-4 flex flex-col gap-3 transition-colors hover:border-grey-600 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grey-800">
            <Package className="h-5 w-5 text-grey-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-p-md font-semibold text-grey-50 truncate">
              {TIPO_CARGA_LABELS[frete.tipoCarga] ?? frete.tipoCarga}
            </p>
            <p className="text-p-sm text-grey-400">
              {new Date(frete.dataInicio).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <StatusBadge status={frete.status} />
      </div>

      {/* Route */}
      <div className="flex items-start gap-2 text-p-sm text-grey-300">
        <MapPin className="h-4 w-4 shrink-0 text-grey-500 mt-0.5" aria-hidden="true" />
        <span className="truncate">
          {frete.origem} → {frete.destino}
        </span>
      </div>

      {/* Who drove — placa + motorista (FR: every freight card shows its driver) */}
      {frete.caminhao && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-p-sm text-grey-400">
          <span className="flex items-center gap-1.5">
            <Truck className="h-4 w-4 shrink-0 text-grey-500" aria-hidden="true" />
            {frete.caminhao.placa}
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            <User className="h-4 w-4 shrink-0 text-grey-500" aria-hidden="true" />
            <span className="truncate">{frete.caminhao.motorista?.nome ?? 'Sem motorista'}</span>
          </span>
        </div>
      )}

      {/* Financials */}
      <div className="grid grid-cols-2 gap-3 rounded-input bg-surface-elevated px-3 py-2">
        <div>
          <p className="text-caption text-grey-500">Valor bruto</p>
          <p className="text-p-sm font-medium text-grey-50">{formatMoeda(frete.valorBruto)}</p>
        </div>
        {frete.totalDespesas !== undefined && (
          <div>
            <p className="text-caption text-grey-500">Despesas</p>
            <p className="text-p-sm font-medium text-error-300">{formatMoeda(frete.totalDespesas)}</p>
          </div>
        )}
      </div>

      {/* KM */}
      {frete.kmFinal && (
        <div className="flex items-center gap-2 text-p-sm text-grey-400">
          <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{frete.kmInicial} → {frete.kmFinal} km ({frete.kmFinal - frete.kmInicial} km)</span>
        </div>
      )}

      {/* Delete action — stopPropagation so the card link doesn't fire */}
      {onDelete && (
        <div className="flex items-center pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-error-400 hover:text-error-300 ml-auto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(frete) }}
            aria-label="Excluir frete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Link>
  )
}
