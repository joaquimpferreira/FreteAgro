// app/(app)/viagem/encerrar.tsx
// Close Trip — collects the last leg's kmFinal, shows the full summary for
// confirmation, then closes the trip. The trip is immutable afterwards, which
// is why this is a two-step screen and not a single button.
// Layer: app — imports from store/, lib/ and components/ only.

import { useState } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import { drain } from '../../../lib/sync/syncQueue'
import { ViagemResumo } from '../../../components/viagem/ViagemResumo'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Surface } from '../../../components/ui/Surface'
import { Chip } from '../../../components/ui/Chip'
import { DataRow } from '../../../components/ui/DataRow'
import { Banner } from '../../../components/ui/Banner'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatKm } from '../../../lib/utils/format'
import { space } from '../../../lib/theme'
import { makeStyles } from '../../../lib/theme/ThemeProvider'

export default function EncerrarViagem() {
  const styles = useStyles()
  const viagem = useViagemStore((s) => s.viagem)
  const encerrarViagem = useViagemStore((s) => s.encerrarViagem)

  const [kmFinalInput, setKmFinalInput] = useState('')
  const [kmFinalError, setKmFinalError] = useState<string | undefined>()
  const [confirmando, setConfirmando] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Encerrar viagem" onBack={() => router.back()} />
        <EmptyState
          icon="car-outline"
          title="Nenhuma viagem aberta"
          description="Não há viagem para encerrar."
        />
      </View>
    )
  }

  const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
  const carregado = trechoAtual.tipo === 'carregado'

  function validateKm(): boolean {
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

  function handleReview() {
    if (!validateKm()) return
    setConfirmando(true)
  }

  // Preview of the legs with the last one closed, for the summary.
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
      // Fire-and-forget sync so the closed trip (CLOSE_TRECHO + CLOSE_VIAGEM)
      // reaches the server right away when online instead of waiting for the
      // next connectivity change. drain() handles its own retry/dead-letter;
      // offline stays queued as before.
      void drain()
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.replace('/(app)/viagem/resumo')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível encerrar a viagem. Tente novamente.'
      Alert.alert('Erro', message)
      setConfirmando(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmando) {
    return (
      <View style={styles.screen}>
        <TopAppBar
          title="Confira antes de encerrar"
          onBack={() => setConfirmando(false)}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Banner
            tone="waiting"
            message="Depois de encerrar, esta viagem não pode mais ser alterada. Confira os números abaixo — é com eles que o seu acerto é calculado."
          />

          <ViagemResumo
            trechos={trechosParaResumo}
            abastecimentos={viagem.abastecimentos}
            despesas={viagem.despesas}
          />

          <View style={styles.actions}>
            <Button
              label="Encerrar viagem"
              icon="flag"
              onPress={handleConfirm}
              loading={submitting}
              prominent
            />
            <Button
              label="Voltar e corrigir"
              onPress={() => setConfirmando(false)}
              variant="outlined"
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </View>
    )
  }

  const kmDigitado = parseInt(kmFinalInput, 10)
  const rodado =
    !isNaN(kmDigitado) && kmDigitado > trechoAtual.kmInicial
      ? kmDigitado - trechoAtual.kmInicial
      : null

  return (
    <View style={styles.screen}>
      <TopAppBar title="Encerrar viagem" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface level={1} padding="lg" style={styles.card}>
          <View style={styles.header}>
            <Text role="titleMedium">Último trecho</Text>
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
          placeholder="122500"
          keyboardType="number-pad"
          suffix="km"
          hint="O número que está no painel agora."
          error={kmFinalError}
        />

        <Button
          label="Ver resumo"
          icon="arrow-forward"
          onPress={handleReview}
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
  actions: {
    gap: space.md,
    marginTop: space.sm,
  },
  submit: {
    marginTop: space.sm,
  },
}))
