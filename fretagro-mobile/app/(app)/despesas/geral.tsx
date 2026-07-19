// app/(app)/despesas/geral.tsx
// General expense registration screen (borracharia, pátio, pedágio, etc.).
// valor is entered in reais and converted to centavos on submit.
// Layer: app — imports from store/, components/, lib/ only.

import { useState } from 'react'
import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import type { TipoLancamento } from '@fretagro/types'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { FotoNota } from '../../../components/despesas/FotoNota'

const TIPOS_DESPESA: { value: TipoLancamento; label: string }[] = [
  { value: 'pedagio', label: 'Pedágio' },
  { value: 'borracharia', label: 'Borracharia' },
  { value: 'patio', label: 'Pátio' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'outro', label: 'Outro' },
]

export default function DespesaGeral() {
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
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-gray-400 text-center">
          Nenhuma viagem em andamento.
        </Text>
      </View>
    )
  }

  const frotaId = viagem.trechos[0]?.frotaId ?? ''
  const freteId = viagem.freteId

  function validate(): boolean {
    const next: Record<string, string> = {}
    const valor = parseFloat(valorInput.replace(',', '.'))

    if (isNaN(valor) || valor <= 0) {
      next.valor = 'Informe um valor maior que R$ 0,00.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      // Convert reais to centavos
      const valorReais = parseFloat(valorInput.replace(',', '.'))
      const valorCentavos = Math.round(valorReais * 100)

      registrarDespesa({
        tipo,
        valor: valorCentavos,
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-white text-2xl font-bold">Registrar Despesa</Text>

      {/* Tipo picker */}
      <View className="gap-2">
        <Text className="text-sm text-gray-400 font-medium">Tipo de despesa</Text>
        <View className="flex-row flex-wrap gap-2">
          {TIPOS_DESPESA.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setTipo(opt.value)}
              className={`min-h-[44px] px-4 rounded-xl border items-center justify-center ${
                tipo === opt.value
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-surface'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  tipo === opt.value ? 'text-black' : 'text-white'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Input
        label="Valor (R$)"
        value={valorInput}
        onChangeText={setValorInput}
        keyboardType="decimal-pad"
        placeholder="Ex: 45,00"
        error={errors.valor}
      />

      <Input
        label="Descrição (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Ex: Pneu dianteiro direito"
        multiline
        numberOfLines={2}
        style={{ minHeight: 60 }}
      />

      <FotoNota
        frotaId={frotaId}
        freteId={freteId}
        storagePath={fotoStoragePath}
        onFoto={setFotoStoragePath}
      />

      <Button
        label="Registrar despesa"
        onPress={handleSubmit}
        loading={submitting}
      />

      <Button
        label="Cancelar"
        onPress={() => router.back()}
        variant="secondary"
        disabled={submitting}
      />
    </ScrollView>
  )
}
