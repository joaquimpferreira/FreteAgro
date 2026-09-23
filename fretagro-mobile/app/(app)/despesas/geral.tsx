// app/(app)/despesas/geral.tsx
// General expense (pedágio, borracharia, pátio, oficina).
// valor is entered in reais and converted to centavos on submit.
// Layer: app — imports from store/, components/, lib/ only.

import { useState } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import type { TipoLancamento } from '@fretagro/types'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { ChoiceChips } from '../../../components/ui/ChoiceChips'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { FotoNota } from '../../../components/despesas/FotoNota'
import { space } from '../../../lib/theme'
import { makeStyles } from '../../../lib/theme/ThemeProvider'

const TIPOS_DESPESA: readonly { value: TipoLancamento; label: string }[] = [
  { value: 'pedagio', label: 'Pedágio' },
  { value: 'borracharia', label: 'Borracharia' },
  { value: 'patio', label: 'Pátio' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'outro', label: 'Outro' },
]

export default function DespesaGeral() {
  const styles = useStyles()
  const viagem = useViagemStore((s) => s.viagem)
  const registrarDespesa = useViagemStore((s) => s.registrarDespesa)

  const [tipo, setTipo] = useState<TipoLancamento>('pedagio')
  const [valorInput, setValorInput] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fotoStoragePath, setFotoStoragePath] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Lançar despesa" onBack={() => router.back()} />
        <EmptyState
          icon="receipt-outline"
          title="Nenhuma viagem aberta"
          description="As despesas entram sempre numa viagem. Abra a viagem antes de lançar."
        />
      </View>
    )
  }

  const frotaId = viagem.trechos[0]?.frotaId ?? ''
  const freteId = viagem.freteId

  function validate(): boolean {
    const next: Record<string, string> = {}
    const valor = parseFloat(valorInput.replace(',', '.'))

    if (isNaN(valor) || valor <= 0) {
      next.valor = 'Digite o valor da despesa. Use vírgula para os centavos, ex: 45,00.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const valorReais = parseFloat(valorInput.replace(',', '.'))

      registrarDespesa({
        tipo,
        valor: Math.round(valorReais * 100),
        descricao: descricao.trim() !== '' ? descricao.trim() : undefined,
        fotoUrl: fotoStoragePath ?? undefined,
      })

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.back()
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a despesa. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Lançar despesa" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text role="bodyMedium" tone="variant">
          Esta despesa entra na viagem aberta e aparece no seu acerto.
        </Text>

        <ChoiceChips
          label="Tipo de despesa"
          choices={TIPOS_DESPESA}
          value={tipo}
          onChange={setTipo}
        />

        <TextField
          label="Valor"
          value={valorInput}
          onChangeText={setValorInput}
          keyboardType="decimal-pad"
          placeholder="45,00"
          suffix="R$"
          error={errors.valor}
        />

        <TextField
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Ex: Pneu dianteiro direito"
          multiline
          numberOfLines={2}
          hint="Opcional — ajuda a lembrar o que foi, na hora do acerto."
        />

        <FotoNota
          frotaId={frotaId}
          freteId={freteId}
          storagePath={fotoStoragePath}
          onFoto={setFotoStoragePath}
        />

        <View style={styles.actions}>
          <Button
            label="Lançar despesa"
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
  actions: {
    gap: space.md,
    marginTop: space.sm,
  },
}))
