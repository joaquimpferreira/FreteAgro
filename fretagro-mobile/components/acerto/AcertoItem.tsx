// components/acerto/AcertoItem.tsx
// US6: Tappable row displaying a settled (realizado) acerto.
// Shows saldoFinal in reais, settlement date in pt-BR, and status badge.
// min-h-[44px] required for accessibility touch target compliance.
// Layer: components — may import from components/ui/ only

import { Pressable, Text, View } from 'react-native'
import { Badge } from '../ui/Badge'
import type { Acerto } from '@fretagro/types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function centavosToReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// AcertoItem
// ─────────────────────────────────────────────────────────────────────────────

interface AcertoItemProps {
  acerto: Acerto
  onPress: (id: string) => void
}

export function AcertoItem({ acerto, onPress }: AcertoItemProps) {
  const settledAt = acerto.realizadoEm ?? acerto.createdAt

  return (
    <Pressable
      className="bg-surface rounded-xl px-4 py-3 mb-3 min-h-[60px] flex-row items-center justify-between active:opacity-70"
      onPress={() => onPress(acerto.id)}
      accessibilityRole="button"
      accessibilityLabel={`Acerto de ${centavosToReais(acerto.saldoFinal)} realizado em ${formatDate(settledAt)}`}
    >
      <View className="flex-1 gap-1">
        <Text className="text-white font-semibold text-base">
          {centavosToReais(acerto.saldoFinal)}
        </Text>
        <Text className="text-gray-400 text-sm">
          {formatDate(settledAt)}
        </Text>
      </View>

      <Badge label="Realizado" variant="success" />
    </Pressable>
  )
}
