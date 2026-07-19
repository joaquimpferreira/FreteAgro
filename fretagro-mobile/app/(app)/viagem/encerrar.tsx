// app/(app)/viagem/encerrar.tsx
// Close Trip screen — collects kmFinal for the last leg, shows ViagemResumo for confirmation,
// then closes the trip. Trip becomes immutable after this action.
// Layer: app — imports from store/ and components/ only.

import { useState } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import { ViagemResumo } from '../../../components/viagem/ViagemResumo'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function EncerrarViagem() {
  const viagem = useViagemStore((s) => s.viagem)
  const encerrarViagem = useViagemStore((s) => s.encerrarViagem)

  const [kmFinalInput, setKmFinalInput] = useState('')
  const [kmFinalError, setKmFinalError] = useState<string | undefined>()
  const [confirmando, setConfirmando] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!viagem) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-gray-400">Nenhuma viagem em andamento.</Text>
      </View>
    )
  }

  const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]

  function validateKm(): boolean {
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

  function handleReview() {
    if (!validateKm()) return
    setConfirmando(true)
  }

  // Build a preview of trechos with the last one closed for the summary
  const kmFinalNum = parseInt(kmFinalInput, 10)
  const trechosParaResumo = confirmando
    ? viagem.trechos.map((t, idx) => {
        if (idx === viagem.trechoAtualIndex && !isNaN(kmFinalNum)) {
          return {
            ...t,
            kmFinal: kmFinalNum,
            kmRodado: kmFinalNum - t.kmInicial,
            fechadoEm: new Date().toISOString(),
          }
        }
        return t
      })
    : []

  async function handleConfirm() {
    if (!validateKm()) return
    setSubmitting(true)

    try {
      encerrarViagem(kmFinalNum)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.replace('/(app)/viagem/resumo')
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível encerrar a viagem.')
      setConfirmando(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmando) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 py-6 gap-4"
      >
        <Text className="text-white text-2xl font-bold">Confirmar encerramento</Text>
        <Text className="text-gray-400 text-sm">
          Revise o resumo abaixo. Após confirmar, a viagem não poderá ser editada.
        </Text>

        <ViagemResumo
          trechos={trechosParaResumo}
          abastecimentos={viagem.abastecimentos}
          despesas={viagem.despesas}
        />

        <Button
          label="Confirmar encerramento"
          onPress={handleConfirm}
          loading={submitting}
          variant="destructive"
        />
        <Button
          label="Voltar"
          onPress={() => setConfirmando(false)}
          variant="secondary"
          disabled={submitting}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-4"
    >
      <Text className="text-white text-2xl font-bold">Encerrar viagem</Text>

      <Card>
        <Text className="text-gray-400 text-sm">Último trecho</Text>
        <Text className="text-white text-base font-semibold mt-1">
          {trechoAtual.tipo === 'vazio' ? 'Vazio' : 'Carregado'} — Km inicial:{' '}
          {trechoAtual.kmInicial.toLocaleString('pt-BR')} km
        </Text>
      </Card>

      <Input
        label="Km final do último trecho"
        value={kmFinalInput}
        onChangeText={(v) => {
          setKmFinalInput(v)
          setKmFinalError(undefined)
        }}
        placeholder="Ex: 122500"
        keyboardType="numeric"
        error={kmFinalError}
      />

      <Button
        label="Ver resumo e confirmar"
        onPress={handleReview}
        variant="primary"
      />
    </ScrollView>
  )
}
