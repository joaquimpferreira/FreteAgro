// app/(app)/despesas/abastecimento.tsx
// Fuel / Arla registration.
// valorTotal is computed from litros × precoPorLitro and shown live — never typed.
// trechoId is set by the store to the current open leg (enables mediaDiesel, FR-013).
// Layer: app — imports from store/, components/, lib/ only.

import { useState, useMemo } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import type { SubtipoAbastecimento } from '@fretagro/types'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Surface } from '../../../components/ui/Surface'
import { SegmentedButtons } from '../../../components/ui/SegmentedButtons'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { FotoNota } from '../../../components/despesas/FotoNota'
import { formatReais } from '../../../lib/utils/format'
import { space } from '../../../lib/theme'
import { makeStyles } from '../../../lib/theme/ThemeProvider'

const SUBTIPOS: readonly { value: SubtipoAbastecimento; label: string }[] = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'arla', label: 'Arla 32' },
]

export default function Abastecimento() {
  const styles = useStyles()
  const viagem = useViagemStore((s) => s.viagem)
  const registrarAbastecimento = useViagemStore((s) => s.registrarAbastecimento)

  const [subtipo, setSubtipo] = useState<SubtipoAbastecimento>('diesel')
  const [litrosInput, setLitrosInput] = useState('')
  const [precoInput, setPrecoInput] = useState('')
  const [local, setLocal] = useState('')
  const [kmAtualInput, setKmAtualInput] = useState('')
  const [fotoStoragePath, setFotoStoragePath] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Live total. The driver is standing at the pump comparing this against the
  // number on its display, so it updates on every keystroke.
  const valorTotalCentavos = useMemo(() => {
    const litros = parseFloat(litrosInput.replace(',', '.'))
    const preco = parseFloat(precoInput.replace(',', '.'))
    if (!isNaN(litros) && !isNaN(preco) && litros > 0 && preco > 0) {
      return Math.round(litros * preco * 100)
    }
    return null
  }, [litrosInput, precoInput])

  if (!viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Abastecimento" onBack={() => router.back()} />
        <EmptyState
          icon="water-outline"
          title="Nenhuma viagem aberta"
          description="O abastecimento entra sempre numa viagem. Abra a viagem antes de registrar."
        />
      </View>
    )
  }

  const frotaId = viagem.trechos[0]?.frotaId ?? ''
  const freteId = viagem.freteId

  function validate(): boolean {
    const next: Record<string, string> = {}
    const litros = parseFloat(litrosInput.replace(',', '.'))
    const preco = parseFloat(precoInput.replace(',', '.'))

    if (isNaN(litros) || litros <= 0) {
      next.litros = 'Digite quantos litros entraram, como está na bomba.'
    }
    if (isNaN(preco) || preco <= 0) {
      next.preco = 'Digite o preço do litro. Use vírgula, ex: 6,50.'
    }
    if (kmAtualInput.trim() !== '') {
      const km = parseInt(kmAtualInput, 10)
      if (isNaN(km) || km <= 0) {
        next.kmAtual = 'Digite só os números do km, sem ponto.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      registrarAbastecimento({
        subtipo,
        litros: parseFloat(litrosInput.replace(',', '.')),
        precoPorLitro: parseFloat(precoInput.replace(',', '.')),
        local: local.trim() !== '' ? local.trim() : undefined,
        kmAtual: kmAtualInput.trim() !== '' ? parseInt(kmAtualInput, 10) : undefined,
        fotoUrl: fotoStoragePath ?? undefined,
      })

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.back()
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o abastecimento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Abastecimento" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SegmentedButtons
          label="O que entrou no tanque"
          segments={SUBTIPOS}
          value={subtipo}
          onChange={setSubtipo}
        />

        <TextField
          label="Litros"
          value={litrosInput}
          onChangeText={setLitrosInput}
          keyboardType="decimal-pad"
          placeholder="180"
          suffix="L"
          error={errors.litros}
        />

        <TextField
          label="Preço do litro"
          value={precoInput}
          onChangeText={setPrecoInput}
          keyboardType="decimal-pad"
          placeholder="6,50"
          suffix="R$"
          error={errors.preco}
        />

        {/* The total the app computed, for the driver to check against the pump
            before he commits. It is never an input: one rounding point only. */}
        <Surface
          level={valorTotalCentavos != null ? 2 : 1}
          padding="lg"
          style={styles.total}
        >
          <Text role="titleMedium" tone="variant">
            Total a pagar
          </Text>
          <Text
            role="figureLarge"
            tone={valorTotalCentavos != null ? 'strong' : 'faint'}
          >
            {valorTotalCentavos != null ? formatReais(valorTotalCentavos) : '—'}
          </Text>
          <Text role="bodySmall" tone="faint">
            {valorTotalCentavos != null
              ? 'Confira com o visor da bomba antes de registrar.'
              : 'Preencha litros e preço para ver o total.'}
          </Text>
        </Surface>

        <TextField
          label="Posto"
          value={local}
          onChangeText={setLocal}
          placeholder="Ex: Posto BR km 210"
          hint="Opcional."
        />

        <TextField
          label="Km do painel"
          value={kmAtualInput}
          onChangeText={setKmAtualInput}
          keyboardType="number-pad"
          placeholder="121500"
          suffix="km"
          hint="Opcional — é o que permite calcular a média do diesel."
          error={errors.kmAtual}
        />

        <FotoNota
          frotaId={frotaId}
          freteId={freteId}
          storagePath={fotoStoragePath}
          onFoto={setFotoStoragePath}
        />

        <View style={styles.actions}>
          <Button
            label="Registrar abastecimento"
            icon="checkmark"
            onPress={handleSubmit}
            loading={submitting}
            prominent
          />
          <Button
            label="Cancelar"
            onPress={() => router.back()}
            variant="outlined"
            disabled={submitting}
          />
        </View>
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
  total: {
    gap: space.xs,
  },
  actions: {
    gap: space.md,
    marginTop: space.sm,
  },
}))
