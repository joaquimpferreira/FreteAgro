// app/(app)/viagem/avancar-trecho.tsx
// Advance Leg screen — closes the current leg and opens the next one.
// Validates kmFinal > current leg kmInicial before submitting.
// Layer: app — imports from store/ and components/ only.

import { useState } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import type { TipoTrecho } from '@fretagro/types'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function AvancarTrecho() {
  const viagem = useViagemStore((s) => s.viagem)
  const avancarTrecho = useViagemStore((s) => s.avancarTrecho)

  const [kmFinalInput, setKmFinalInput] = useState('')
  const [tipoProximo, setTipoProximo] = useState<TipoTrecho>('carregado')
  const [kmFinalError, setKmFinalError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  if (!viagem) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-gray-400">Nenhuma viagem em andamento.</Text>
      </View>
    )
  }

  const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]

  function validate(): boolean {
    const kmFinalNum = parseInt(kmFinalInput, 10)
    if (!kmFinalInput.trim() || isNaN(kmFinalNum)) {
      setKmFinalError('Informe o km final.')
      return false
    }
    if (kmFinalNum <= trechoAtual.kmInicial) {
      setKmFinalError(
        `Km final deve ser maior que o km inicial (${trechoAtual.kmInicial.toLocaleString('pt-BR')} km).`,
      )
      return false
    }
    setKmFinalError(undefined)
    return true
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)

    const kmFinalNum = parseInt(kmFinalInput, 10)

    try {
      // avancarTrecho closes current leg AND opens the next one
      avancarTrecho(kmFinalNum, tipoProximo, kmFinalNum)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.replace('/(app)/viagem/em-curso')
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível avançar o trecho.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-4"
    >
      <Text className="text-white text-2xl font-bold">Avançar trecho</Text>

      {/* Current leg info */}
      <Card>
        <Text className="text-gray-400 text-sm">Trecho atual</Text>
        <Text className="text-white text-base font-semibold mt-1">
          {trechoAtual.tipo === 'vazio' ? 'Vazio' : 'Carregado'} — Km inicial:{' '}
          {trechoAtual.kmInicial.toLocaleString('pt-BR')} km
        </Text>
      </Card>

      <Input
        label="Km final deste trecho"
        value={kmFinalInput}
        onChangeText={(v) => {
          setKmFinalInput(v)
          setKmFinalError(undefined)
        }}
        placeholder="Ex: 121800"
        keyboardType="numeric"
        error={kmFinalError}
      />

      {/* Next leg tipo picker */}
      <View className="gap-1">
        <Text className="text-sm text-gray-400 font-medium">Tipo do próximo trecho</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Vazio"
              onPress={() => setTipoProximo('vazio')}
              variant={tipoProximo === 'vazio' ? 'primary' : 'secondary'}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Carregado"
              onPress={() => setTipoProximo('carregado')}
              variant={tipoProximo === 'carregado' ? 'primary' : 'secondary'}
            />
          </View>
        </View>
      </View>

      <Button
        label="Avançar trecho"
        onPress={handleSubmit}
        loading={submitting}
        variant="primary"
      />
    </ScrollView>
  )
}
