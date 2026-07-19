// app/(app)/viagem/em-curso.tsx
// Active Trip Panel — shows current open leg, closed leg history, running expense total.
// Action buttons: advance leg, close trip, add fuel, add expense.
// Layer: app — imports from store/, components/ only.

import { View, Text, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useViagemStore } from '../../../store/viagemStore'
import { TrechoAtual } from '../../../components/viagem/TrechoAtual'
import { TrechoCard } from '../../../components/viagem/TrechoCard'
import { OfflineBanner } from '../../../components/ui/OfflineBanner'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

function formatReal(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function EmCurso() {
  const viagem = useViagemStore((s) => s.viagem)

  if (!viagem) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-gray-400 text-center">
          Nenhuma viagem em andamento.
        </Text>
        <View className="mt-4 w-full">
          <Button
            label="Iniciar viagem"
            onPress={() => router.replace('/(app)/viagem/iniciar')}
          />
        </View>
      </View>
    )
  }

  const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
  const trechosFechados = viagem.trechos.filter((t) => t.fechadoEm != null)

  const totalAbastecimentos = viagem.abastecimentos.reduce(
    (acc, a) => acc + a.valorTotal,
    0,
  )
  const totalDespesas = viagem.despesas.reduce((acc, d) => acc + d.valor, 0)
  const totalGeral = totalAbastecimentos + totalDespesas

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <ScrollView contentContainerClassName="px-4 py-6 gap-4">
        {/* Header */}
        <View>
          <Text className="text-white text-2xl font-bold">Viagem em curso</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {viagem.trechos.length > 0
              ? `${trechosFechados.length} trecho${trechosFechados.length !== 1 ? 's' : ''} concluído${trechosFechados.length !== 1 ? 's' : ''}`
              : ''}
            {viagem.pendenteSincronizacao ? '  ·  Pendente de sincronização' : ''}
          </Text>
        </View>

        {/* Running expense total */}
        <Card>
          <Text className="text-gray-400 text-sm">Total de despesas</Text>
          <Text className="text-red-400 text-xl font-bold mt-1">
            {formatReal(totalGeral)}
          </Text>
        </Card>

        {/* Current open leg + main CTAs */}
        {trechoAtual && (
          <TrechoAtual
            trecho={trechoAtual}
            onAvancar={() => router.push('/(app)/viagem/avancar-trecho')}
            onEncerrar={() => router.push('/(app)/viagem/encerrar')}
          />
        )}

        {/* Expense actions */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Abastecer"
              onPress={() => router.push('/(app)/despesas/abastecimento')}
              variant="secondary"
            />
          </View>
          <View className="flex-1">
            <Button
              label="Despesa"
              onPress={() => router.push('/(app)/despesas/geral')}
              variant="secondary"
            />
          </View>
        </View>

        {/* Closed legs history */}
        {trechosFechados.length > 0 && (
          <View className="gap-2">
            <Text className="text-gray-400 text-sm font-medium">Trechos concluídos</Text>
            {trechosFechados.map((t, idx) => (
              <TrechoCard
                key={t.id}
                trecho={t}
                abastecimentos={viagem.abastecimentos}
                numero={idx + 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
