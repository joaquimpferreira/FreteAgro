// components/viagem/TrechoAtual.tsx
// The open leg: where it started, what has gone into it, and what it is still
// missing.
//
// The two actions that close a leg used to live in this card. They moved out:
// "Avançar trecho" is the screen's one primary action and is now docked at the
// bottom edge (ScreenActions), and "Encerrar viagem" sits at the end of the
// content, because it makes the trip immutable and must not be the thing under
// the driver's thumb.
//
// What the card gained in their place is not filler. The litres already logged
// against this leg and the line naming the one missing reading are both facts
// the driver put there himself, and both answer the question he actually opens
// this screen with: what is still open on this stretch.
//
// Layer: components — state arrives by prop, no store import.

import { View, StyleSheet } from 'react-native'
import type { TrechoKm, Abastecimento } from '@fretagro/types'
import { Text } from '../ui/Text'
import { Chip } from '../ui/Chip'
import { Surface } from '../ui/Surface'
import { DataRow } from '../ui/DataRow'
import { formatKm, formatLitros } from '../../lib/utils/format'
import { space } from '../../lib/theme'

interface TrechoAtualProps {
  trecho: TrechoKm
  /** Position among the trip's legs, 1-based. */
  numero: number
  /** Every refuel on the trip — the card filters to this leg's own. */
  abastecimentos?: Abastecimento[]
}

export function TrechoAtual({ trecho, numero, abastecimentos = [] }: TrechoAtualProps) {
  const carregado = trecho.tipo === 'carregado'

  const litros = abastecimentos
    .filter((a) => a.trechoId === trecho.id)
    .reduce((acc, a) => acc + a.litros, 0)

  return (
    <Surface level={2} padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text role="titleMedium">Trecho {numero} · aberto</Text>
        <Chip
          label={carregado ? 'Carregado' : 'Vazio'}
          tone="live"
          icon={carregado ? 'cube' : 'cube-outline'}
        />
      </View>

      <View style={styles.rows}>
        <DataRow label="Km de saída" value={formatKm(trecho.kmInicial)} />
        {litros > 0 && <DataRow label="Abastecido aqui" value={formatLitros(litros)} />}
      </View>

      <Text role="bodySmall" tone="waiting">
        Falta o km de chegada. Anote quando descarregar.
      </Text>
    </Surface>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  rows: {
    gap: space.sm,
  },
})
