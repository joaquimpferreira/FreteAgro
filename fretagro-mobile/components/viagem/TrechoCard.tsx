// components/viagem/TrechoCard.tsx
// Displays a single closed road leg: tipo badge, km values, mediaDiesel.
// Closed style with muted colors to signal immutability.
// Layer: components — imports from @fretagro/types and components/ui only.

import { View, Text } from 'react-native'
import type { TrechoKm, Abastecimento } from '@fretagro/types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { mediaDieselParaTrecho } from '../../lib/viagem/calcularViagem'

interface TrechoCardProps {
  trecho: TrechoKm
  abastecimentos?: Abastecimento[]
  /** Visual order label shown as "Trecho N" */
  numero: number
}

export function TrechoCard({ trecho, abastecimentos = [], numero }: TrechoCardProps) {
  const isOpen = trecho.fechadoEm == null

  const media = !isOpen
    ? mediaDieselParaTrecho(trecho, abastecimentos)
    : null

  return (
    <Card className={isOpen ? '' : 'opacity-80'}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-400 text-sm font-medium">Trecho {numero}</Text>
        <Badge
          label={trecho.tipo === 'vazio' ? 'Vazio' : 'Carregado'}
          variant={trecho.tipo === 'carregado' ? 'success' : 'muted'}
        />
      </View>

      <View className="gap-2">
        <View className="flex-row justify-between">
          <Text className="text-gray-400 text-sm">Km inicial</Text>
          <Text className="text-white text-sm font-medium">{trecho.kmInicial.toLocaleString('pt-BR')} km</Text>
        </View>

        {trecho.kmFinal != null && (
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Km final</Text>
            <Text className="text-white text-sm font-medium">{trecho.kmFinal.toLocaleString('pt-BR')} km</Text>
          </View>
        )}

        {trecho.kmRodado != null && (
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Km rodado</Text>
            <Text className="text-green-400 text-sm font-semibold">{trecho.kmRodado.toLocaleString('pt-BR')} km</Text>
          </View>
        )}

        {media != null && (
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Média diesel</Text>
            <Text className="text-blue-400 text-sm font-medium">{media.toFixed(2)} km/l</Text>
          </View>
        )}

        {isOpen && (
          <View className="mt-1">
            <Text className="text-yellow-400 text-xs italic">Em andamento…</Text>
          </View>
        )}
      </View>
    </Card>
  )
}
