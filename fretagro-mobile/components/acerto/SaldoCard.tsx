// components/acerto/SaldoCard.tsx
// US6: the driver's pending settlement balance.
//
// The balance leads as a figure, then the two lines that produce it. That
// order is the point of the product: PRODUCT.md records that the driver must
// be able to trace his own money, so the total never appears without the
// commission and the deductions reachable right under it.
//
// Read-only (FR-034) — the owner's panel is authoritative, and the card says so.
// Layer: components — imports from components/ui and hooks types only.

import { View, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { Surface } from '../ui/Surface'
import { DataRow } from '../ui/DataRow'
import { formatReais } from '../../lib/utils/format'
import { space } from '../../lib/theme'
import type { PendingBalance } from '../../hooks/useAcerto'

interface SaldoCardProps {
  balance: PendingBalance
}

export function SaldoCard({ balance }: SaldoCardProps) {
  const nada = balance.saldoFinal === 0 && balance.valorComissao === 0

  return (
    <Surface level={1} padding="lg" style={styles.card}>
      <Text role="titleMedium" tone="variant">
        A receber
      </Text>

      <Text role="figureLarge" tone={nada ? 'faint' : 'strong'}>
        {formatReais(balance.saldoFinal)}
      </Text>

      <View style={styles.rows}>
        <DataRow label="Comissão bruta" value={formatReais(balance.valorComissao)} />
        <DataRow label="Deduções" value={`− ${formatReais(balance.totalDeducoes)}`} />
      </View>

      <Text role="bodySmall" tone="faint">
        Estimativa das viagens ainda não acertadas. O valor final é o que o dono da
        frota confirmar no painel.
      </Text>
    </Surface>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: space.xs,
  },
  rows: {
    gap: space.sm,
    marginTop: space.md,
  },
})
