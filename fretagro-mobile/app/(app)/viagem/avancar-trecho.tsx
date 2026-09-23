// app/(app)/viagem/avancar-trecho.tsx
// Advance Leg — closes the open leg and opens the next one.
// Validates kmFinal > the open leg's kmInicial before submitting.
// Layer: app — imports from store/ and components/ only.

import { useState } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import type { TipoTrecho } from '@fretagro/types'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Surface } from '../../../components/ui/Surface'
import { Chip } from '../../../components/ui/Chip'
import { DataRow } from '../../../components/ui/DataRow'
import { SegmentedButtons } from '../../../components/ui/SegmentedButtons'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatKm } from '../../../lib/utils/format'
import { space } from '../../../lib/theme'
import { makeStyles } from '../../../lib/theme/ThemeProvider'

const TIPOS: readonly { value: TipoTrecho; label: string }[] = [
  { value: 'vazio', label: 'Vazio' },
  { value: 'carregado', label: 'Carregado' },
]

export default function AvancarTrecho() {
  const styles = useStyles()
  const viagem = useViagemStore((s) => s.viagem)
  const avancarTrecho = useViagemStore((s) => s.avancarTrecho)

  const [kmFinalInput, setKmFinalInput] = useState('')
  const [tipoProximo, setTipoProximo] = useState<TipoTrecho>('carregado')
  const [kmFinalError, setKmFinalError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  if (!viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Avançar trecho" onBack={() => router.back()} />
        <EmptyState
          icon="car-outline"
          title="Nenhuma viagem aberta"
          description="Não há trecho para avançar. Abra uma viagem primeiro."
        />
      </View>
    )
  }

  const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
  const carregado = trechoAtual.tipo === 'carregado'

  function validate(): boolean {
    const kmFinalNum = parseInt(kmFinalInput, 10)
    if (!kmFinalInput.trim() || isNaN(kmFinalNum)) {
      setKmFinalError('Leia o km no painel e digite só os números.')
      return false
    }
    if (kmFinalNum <= trechoAtual.kmInicial) {
      setKmFinalError(
        `O km de chegada precisa ser maior que o de saída (${formatKm(trechoAtual.kmInicial)}). Confira o número.`,
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
      // avancarTrecho closes the current leg AND opens the next one.
      avancarTrecho(kmFinalNum, tipoProximo, kmFinalNum)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.replace('/(app)/viagem/em-curso')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível avançar o trecho. Tente novamente.'
      Alert.alert('Erro', message)
    } finally {
      setSubmitting(false)
    }
  }

  const kmDigitado = parseInt(kmFinalInput, 10)
  const rodado =
    !isNaN(kmDigitado) && kmDigitado > trechoAtual.kmInicial
      ? kmDigitado - trechoAtual.kmInicial
      : null

  return (
    <View style={styles.screen}>
      <TopAppBar title="Avançar trecho" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface level={1} padding="lg" style={styles.card}>
          <View style={styles.header}>
            <Text role="titleMedium">Fechando este trecho</Text>
            <Chip
              label={carregado ? 'Carregado' : 'Vazio'}
              tone="neutral"
              icon={carregado ? 'cube' : 'cube-outline'}
            />
          </View>
          <DataRow label="Km de saída" value={formatKm(trechoAtual.kmInicial)} />
          {rodado != null && (
            <DataRow
              label="Rodado neste trecho"
              value={formatKm(rodado)}
              emphasis="positive"
              divided
            />
          )}
        </Surface>

        <TextField
          label="Km de chegada"
          value={kmFinalInput}
          onChangeText={(v) => {
            setKmFinalInput(v)
            setKmFinalError(undefined)
          }}
          placeholder="121800"
          keyboardType="number-pad"
          suffix="km"
          hint="O número que está no painel agora."
          error={kmFinalError}
        />

        <SegmentedButtons
          label="O próximo trecho sai"
          segments={TIPOS}
          value={tipoProximo}
          onChange={setTipoProximo}
        />

        <Button
          label="Avançar trecho"
          icon="arrow-forward"
          onPress={handleSubmit}
          loading={submitting}
          prominent
          style={styles.submit}
        />
      </ScrollView>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: space.base,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  card: {
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  submit: {
    marginTop: space.sm,
  },
}))
