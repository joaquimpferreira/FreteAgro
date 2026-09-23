// components/viagem/TrechoCard.tsx
// A single road leg. Closed legs step down a surface level and drop their
// chip to a quiet tone — a finished leg is a record, not a thing to act on.
// Layer: components — imports from @fretagro/types, lib/ and components/ui only.

import { View, StyleSheet } from 'react-native'
import type { TrechoKm, Abastecimento } from '@fretagro/types'
import { Text } from '../ui/Text'
import { Chip } from '../ui/Chip'
import { Surface } from '../ui/Surface'
import { DataRow } from '../ui/DataRow'
import { mediaDieselParaTrecho } from '../../lib/viagem/calcularViagem'
import { formatKm, formatMedia } from '../../lib/utils/format'
import { space } from '../../lib/theme'

interface TrechoCardProps {
  trecho: TrechoKm
  abastecimentos?: Abastecimento[]
  /** Visual order label shown as "Trecho N". */
  numero: number
}

export function TrechoCard({ trecho, abastecimentos = [], numero }: TrechoCardProps) {
  const isOpen = trecho.fechadoEm == null
  const media = !isOpen ? mediaDieselParaTrecho(trecho, abastecimentos) : null
  const carregado = trecho.tipo === 'carregado'

  return (
    <Surface level={isOpen ? 2 : 1} radius="medium" padding="base" style={styles.card}>
      <View style={styles.header}>
        <Text role="titleSmall" tone="variant">
          Trecho {numero}
        </Text>
        <Chip
          label={carregado ? 'Carregado' : 'Vazio'}
          tone={isOpen ? 'live' : 'neutral'}
          icon={carregado ? 'cube' : 'cube-outline'}
        />
      </View>

      <View style={styles.rows}>
        <DataRow label="Km de saída" value={formatKm(trecho.kmInicial)} />

        {trecho.kmFinal != null && (
          <DataRow label="Km de chegada" value={formatKm(trecho.kmFinal)} />
        )}

        {trecho.kmRodado != null && (
          <DataRow
            label="Rodado"
            value={formatKm(trecho.kmRodado)}
            emphasis="positive"
            divided
          />
        )}

        {media != null && <DataRow label="Média do diesel" value={formatMedia(media)} />}
      </View>

      {isOpen && (
        <Text role="bodySmall" tone="waiting">
          Aberto — falta o km de chegada.
        </Text>
      )}
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
