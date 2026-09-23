// components/acerto/FreteAguardandoItem.tsx
// US6: a concluded trip whose acerto the fleet owner has not opened yet.
//
// Not tappable — there is nothing behind it to open. The estimate is labeled as
// an estimate on the row itself, because a figure the driver reads as final and
// later sees change is exactly the dispute this product exists to prevent.
//
// Layer: components — imports from components/ui and hooks types only.

import { ListItem } from '../ui/ListItem'
import { formatDate, formatReais } from '../../lib/utils/format'
import type { FreteAguardando } from '../../hooks/useAcerto'

interface FreteAguardandoItemProps {
  frete: FreteAguardando
}

export function FreteAguardandoItem({ frete }: FreteAguardandoItemProps) {
  const concluida = frete.dataFim != null ? formatDate(frete.dataFim) : '—'

  return (
    <ListItem
      headline={`${frete.origem} → ${frete.destino}`}
      supporting={`Concluída em ${concluida} · estimativa ${formatReais(frete.saldoEstimado)}`}
      chip={{ label: 'Aguardando o dono da frota', tone: 'neutral' }}
      leadingIcon="time-outline"
    />
  )
}
