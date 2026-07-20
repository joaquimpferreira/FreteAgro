// components/acerto/FreteAguardandoItem.tsx
// US6: Non-tappable row for a concluded frete that has no acerto yet.
// Shows route (origem → destino), estimated saldo, date concluded, and "Aguardando" badge.
// Estimated saldo = Math.round(valorBruto * percentualComissao / 100) − deducoesEstimadas.
// Layer: components — may import from components/ui/ only

import { Text, View } from 'react-native'
import { Badge } from '../ui/Badge'
import type { FreteAguardando } from '../../hooks/useAcerto'

function centavosToReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface FreteAguardandoItemProps {
  frete: FreteAguardando
}

export function FreteAguardandoItem({ frete }: FreteAguardandoItemProps) {
  return (
    <View
      className="bg-surface rounded-xl px-4 py-3 mb-3 min-h-[60px] flex-row items-center justify-between"
      accessibilityLabel={`Viagem ${frete.origem} para ${frete.destino} aguardando acerto`}
    >
      <View className="flex-1 gap-1 mr-3">
        <Text className="text-white font-semibold text-base" numberOfLines={1}>
          {centavosToReais(frete.saldoEstimado)}
        </Text>
        <Text className="text-gray-400 text-sm" numberOfLines={1}>
          {frete.origem} → {frete.destino}
        </Text>
        <Text className="text-gray-500 text-xs">
          Concluída em {formatDate(frete.dataFim)}
        </Text>
      </View>

      <Badge label="Aguardando" variant="muted" />
    </View>
  )
}
