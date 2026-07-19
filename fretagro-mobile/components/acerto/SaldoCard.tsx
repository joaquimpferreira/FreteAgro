// components/acerto/SaldoCard.tsx
// US6: Card showing the driver's pending settlement balance.
// Displays valorComissao, totalDeducoes, and saldoFinal (in reais).
// Read-only (FR-034) — no edit actions.
// Layer: components — may import from components/ui/ only

import { Text, View } from 'react-native'
import { Card } from '../ui/Card'
import type { PendingBalance } from '../../hooks/useAcerto'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function centavosToReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Row sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface SaldoRowProps {
  label: string
  value: number
  emphasized?: boolean
  negative?: boolean
}

function SaldoRow({ label, value, emphasized = false, negative = false }: SaldoRowProps) {
  const textColor = negative
    ? 'text-red-400'
    : emphasized
      ? 'text-primary'
      : 'text-white'

  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-sm ${emphasized ? 'font-bold text-base' : 'text-gray-400'}`}>
        {label}
      </Text>
      <Text className={`font-semibold ${emphasized ? 'text-base' : 'text-sm'} ${textColor}`}>
        {centavosToReais(value)}
      </Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SaldoCard
// ─────────────────────────────────────────────────────────────────────────────

interface SaldoCardProps {
  balance: PendingBalance
}

export function SaldoCard({ balance }: SaldoCardProps) {
  return (
    <Card className="gap-1">
      <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
        Saldo a receber
      </Text>

      <SaldoRow label="Comissão bruta" value={balance.valorComissao} />

      <View className="border-b border-gray-700 my-1" />

      <SaldoRow
        label="Deduções"
        value={balance.totalDeducoes}
        negative={balance.totalDeducoes > 0}
      />

      <View className="border-b border-gray-700 my-1" />

      <SaldoRow
        label="A receber"
        value={balance.saldoFinal}
        emphasized
      />
    </Card>
  )
}
