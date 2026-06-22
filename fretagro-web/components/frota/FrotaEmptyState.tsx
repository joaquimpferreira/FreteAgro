// components/frota/FrotaEmptyState.tsx — Empty state for the fleet page
// Server Component — no interactivity needed

import { Truck } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

interface FrotaEmptyStateProps {
  type: 'caminhoes' | 'motoristas'
  action?: React.ReactNode
}

const CONTENT = {
  caminhoes: {
    title:       'Nenhum caminhão cadastrado',
    description: 'Adicione seu primeiro caminhão para começar a registrar fretes.',
  },
  motoristas: {
    title:       'Nenhum motorista cadastrado',
    description: 'Adicione motoristas para vinculá-los aos caminhões da frota.',
  },
}

export function FrotaEmptyState({ type, action }: FrotaEmptyStateProps) {
  const { title, description } = CONTENT[type]
  return (
    <EmptyState
      icon={Truck}
      title={title}
      description={description}
      action={action}
    />
  )
}
