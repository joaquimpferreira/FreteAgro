// components/viagem/ViagemResumo.tsx
// Aggregated trip summary: every leg, km totals, expense totals.
// Used by encerrar.tsx (as the confirmation the driver reads before the trip
// becomes immutable) and resumo.tsx (read-only, after).
// Layer: components — imports from @fretagro/types, lib/ and components/ui only.

import { View, StyleSheet } from 'react-native'
import type { TrechoKm, Abastecimento, Lancamento } from '@fretagro/types'
import { Text } from '../ui/Text'
import { Surface } from '../ui/Surface'
import { DataRow } from '../ui/DataRow'
import { TrechoCard } from './TrechoCard'
import {
  kmTotalVazio,
  kmTotalCarregado,
  kmTotalViagem,
} from '../../lib/viagem/calcularViagem'
import { formatKm, formatReais } from '../../lib/utils/format'
import { space } from '../../lib/theme'

interface ViagemResumoProps {
  trechos: TrechoKm[]
  abastecimentos: Abastecimento[]
  despesas: Lancamento[]
}

export function ViagemResumo({ trechos, abastecimentos, despesas }: ViagemResumoProps) {
  const totalAbastecimentos = abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0)
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0)
  const totalGeral = totalAbastecimentos + totalDespesas

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text role="titleMedium" tone="variant">
          Trechos
        </Text>
        <View style={styles.legs}>
          {trechos.map((t, idx) => (
            <TrechoCard
              key={t.id}
              trecho={t}
              abastecimentos={abastecimentos}
              numero={idx + 1}
            />
          ))}
        </View>
      </View>

      <Surface level={1} padding="lg" style={styles.card}>
        <Text role="titleMedium">Km da viagem</Text>
        <View style={styles.rows}>
          <DataRow label="Vazio" value={formatKm(kmTotalVazio(trechos))} />
          <DataRow label="Carregado" value={formatKm(kmTotalCarregado(trechos))} />
          <DataRow
            label="Total rodado"
            value={formatKm(kmTotalViagem(trechos))}
            emphasis="positive"
            divided
          />
        </View>
      </Surface>

      <Surface level={1} padding="lg" style={styles.card}>
        <Text role="titleMedium">Despesas da viagem</Text>
        <View style={styles.rows}>
          <DataRow label="Abastecimentos" value={formatReais(totalAbastecimentos)} />
          <DataRow label="Outras despesas" value={formatReais(totalDespesas)} />
          <DataRow
            label="Total"
            value={formatReais(totalGeral)}
            emphasis="negative"
            divided
          />
        </View>
      </Surface>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: space.base,
  },
  section: {
    gap: space.md,
  },
  legs: {
    gap: space.sm,
  },
  card: {
    gap: space.base,
  },
  rows: {
    gap: space.sm,
  },
})
