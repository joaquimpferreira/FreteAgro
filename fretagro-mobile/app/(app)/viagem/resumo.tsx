// app/(app)/viagem/resumo.tsx
// Trip Summary screen — read-only view of the completed trip.
// Shows all legs, km totals, and all expenses. No edit actions.
// Layer: app — imports from store/ and components/ only.

import { View, Text, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useViagemStore } from '../../../store/viagemStore'
import { ViagemResumo } from '../../../components/viagem/ViagemResumo'
import { Button } from '../../../components/ui/Button'

export default function ViagemResumoScreen() {
  const viagem = useViagemStore((s) => s.viagemEncerrada)
  const limparViagemEncerrada = useViagemStore((s) => s.limparViagemEncerrada)

  function handleGoHome() {
    limparViagemEncerrada()
    router.replace('/(app)/')
  }

  function handleGoHistorico() {
    limparViagemEncerrada()
    router.replace('/(app)/historico')
  }

  if (!viagem) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-gray-400 text-center">
          Nenhuma viagem para exibir.
        </Text>
        <View className="mt-4 w-full">
          <Button
            label="Ir para início"
            onPress={handleGoHome}
          />
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-4"
    >
      <Text className="text-white text-2xl font-bold">Resumo da viagem</Text>
      <Text className="text-gray-400 text-sm">
        Viagem encerrada. Dados serão sincronizados automaticamente quando houver conexão.
      </Text>

      <ViagemResumo
        trechos={viagem.trechos}
        abastecimentos={viagem.abastecimentos}
        despesas={viagem.despesas}
      />

      <View className="gap-3">
        <Button
          label="Ir para histórico"
          onPress={handleGoHistorico}
          variant="secondary"
        />
        <Button
          label="Ir para início"
          onPress={handleGoHome}
          variant="primary"
        />
      </View>
    </ScrollView>
  )
}
