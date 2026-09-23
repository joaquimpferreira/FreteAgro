// components/acerto/AcertoItem.tsx
// US6: a settled or open acerto, as one row.
//
// The money is the headline because it is what the driver is scanning for;
// the date is supporting text; the status is a chip with a written label.
// Layer: components — imports from components/ui and @fretagro/types only.

import { ListItem } from '../ui/ListItem'
import { formatDate, formatReais } from '../../lib/utils/format'
import type { Acerto } from '@fretagro/types'

interface AcertoItemProps {
  acerto: Acerto
  onPress: (id: string) => void
}

export function AcertoItem({ acerto, onPress }: AcertoItemProps) {
  const isPendente = acerto.status === 'pendente'
  const displayDate = isPendente ? acerto.createdAt : (acerto.realizadoEm ?? acerto.createdAt)

  return (
    <ListItem
      headline={formatReais(acerto.saldoFinal)}
      supporting={
        isPendente ? `Aberto em ${formatDate(displayDate)}` : `Pago em ${formatDate(displayDate)}`
      }
      chip={
        isPendente
          ? { label: 'Aguardando pagamento', tone: 'waiting' }
          : { label: 'Pago', tone: 'done' }
      }
      leadingIcon={isPendente ? 'hourglass-outline' : 'checkmark-circle-outline'}
      onPress={() => onPress(acerto.id)}
    />
  )
}
