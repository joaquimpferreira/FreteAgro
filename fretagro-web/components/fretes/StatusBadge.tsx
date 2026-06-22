// components/fretes/StatusBadge.tsx — Freight status badge
// Server Component — pure display, no interactivity needed

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { StatusFrete } from '@/types/frete'

const STATUS_LABELS: Record<StatusFrete, string> = {
  em_andamento:     'Em andamento',
  concluido:        'Concluído',
  acerto_pendente:  'Acerto pendente',
  acerto_realizado: 'Acerto realizado',
}

// Map statuses to tailwind classes using design-system tokens
const STATUS_CLASSES: Record<StatusFrete, string> = {
  em_andamento:     'border-secondary-400/30 bg-secondary-400/15 text-secondary-300',
  concluido:        'border-success-400/30 bg-success-400/15 text-success-300',
  acerto_pendente:  'border-warning-400/30 bg-warning-400/15 text-warning-300',
  acerto_realizado: 'border-primary-400/30 bg-primary-400/15 text-primary-300',
}

interface StatusBadgeProps {
  status: StatusFrete
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
