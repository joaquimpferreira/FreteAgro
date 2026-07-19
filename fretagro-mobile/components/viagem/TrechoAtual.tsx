// components/viagem/TrechoAtual.tsx
// Displays the currently open road leg with the main trip action buttons.
// Layer: components — reads from store via prop drilling, no direct store imports.

import { View, Text } from 'react-native'
import type { TrechoKm } from '@fretagro/types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface TrechoAtualProps {
  trecho: TrechoKm
  onAvancar: () => void
  onEncerrar: () => void
}

export function TrechoAtual({ trecho, onAvancar, onEncerrar }: TrechoAtualProps) {
  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-semibold text-base">Trecho atual</Text>
        <Badge
          label={trecho.tipo === 'vazio' ? 'Vazio' : 'Carregado'}
          variant={trecho.tipo === 'carregado' ? 'success' : 'muted'}
        />
      </View>

      <View className="flex-row justify-between mb-4">
        <Text className="text-gray-400 text-sm">Km inicial</Text>
        <Text className="text-white text-sm font-medium">
          {trecho.kmInicial.toLocaleString('pt-BR')} km
        </Text>
      </View>

      <View className="gap-3">
        <Button label="Avançar trecho" onPress={onAvancar} variant="primary" />
        <Button label="Encerrar viagem" onPress={onEncerrar} variant="destructive" />
      </View>
    </Card>
  )
}
