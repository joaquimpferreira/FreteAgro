// components/viagem/ViagemResumo.tsx
// Aggregated trip summary: all legs + km totals + total expenses.
// Used in encerrar.tsx (confirmation) and resumo.tsx (read-only).
// Layer: components — imports from @fretagro/types, lib/viagem, and ui only.

import { View, Text, ScrollView } from 'react-native'
import type { TrechoKm, Abastecimento, Lancamento } from '@fretagro/types'
import {
  kmTotalVazio,
  kmTotalCarregado,
  kmTotalViagem,
} from '../../lib/viagem/calcularViagem'
import { TrechoCard } from './TrechoCard'
import { Card } from '../ui/Card'

interface ViagemResumoProps {
  trechos: TrechoKm[]
  abastecimentos: Abastecimento[]
  despesas: Lancamento[]
}

function formatReal(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function ViagemResumo({ trechos, abastecimentos, despesas }: ViagemResumoProps) {
  const totalAbastecimentos = abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0)
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0)
  const totalGeral = totalAbastecimentos + totalDespesas

  return (
    <View className="gap-4">
      {/* Leg list */}
      <View className="gap-2">
        {trechos.map((t, idx) => (
          <TrechoCard
            key={t.id}
            trecho={t}
            abastecimentos={abastecimentos}
            numero={idx + 1}
          />
        ))}
      </View>

      {/* Km totals */}
      <Card>
        <Text className="text-white font-semibold text-base mb-3">Km da viagem</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Km vazio</Text>
            <Text className="text-white text-sm font-medium">
              {kmTotalVazio(trechos).toLocaleString('pt-BR')} km
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Km carregado</Text>
            <Text className="text-white text-sm font-medium">
              {kmTotalCarregado(trechos).toLocaleString('pt-BR')} km
            </Text>
          </View>
          <View className="flex-row justify-between border-t border-surface mt-1 pt-2">
            <Text className="text-white text-sm font-semibold">Total</Text>
            <Text className="text-green-400 text-sm font-semibold">
              {kmTotalViagem(trechos).toLocaleString('pt-BR')} km
            </Text>
          </View>
        </View>
      </Card>

      {/* Expense totals */}
      <Card>
        <Text className="text-white font-semibold text-base mb-3">Despesas</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Abastecimentos</Text>
            <Text className="text-white text-sm font-medium">
              {formatReal(totalAbastecimentos)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Outras despesas</Text>
            <Text className="text-white text-sm font-medium">
              {formatReal(totalDespesas)}
            </Text>
          </View>
          <View className="flex-row justify-between border-t border-surface mt-1 pt-2">
            <Text className="text-white text-sm font-semibold">Total</Text>
            <Text className="text-red-400 text-sm font-semibold">
              {formatReal(totalGeral)}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  )
}
