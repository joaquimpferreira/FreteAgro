// app/(app)/despesas/abastecimento.tsx
// Fuel/Arla refuel registration screen.
// valorTotal is computed automatically from litros × precoPorLitro — never entered manually.
// trechoId is automatically set by the store to the current open leg (enables mediaDiesel per FR-013).
// Layer: app — imports from store/, components/, lib/ only.

import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import type { SubtipoAbastecimento } from '@fretagro/types'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { FotoNota } from '../../../components/despesas/FotoNota'

function centavosToReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const SUBTIPOS: { value: SubtipoAbastecimento; label: string }[] = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'arla', label: 'Arla 32' },
]

export default function Abastecimento() {
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

  // Real-time valorTotal computation
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
    const litros = parseFloat(litrosInput.replace(',', '.'))
    const preco = parseFloat(precoInput.replace(',', '.'))

    if (isNaN(litros) || litros <= 0) {
      next.litros = 'Informe a quantidade de litros (deve ser maior que 0).'
    }
    if (isNaN(preco) || preco <= 0) {
      next.preco = 'Informe o preço por litro (deve ser maior que 0).'
    }
    if (kmAtualInput.trim() !== '') {
      const km = parseInt(kmAtualInput, 10)
      if (isNaN(km) || km <= 0) {
        next.kmAtual = 'KM atual deve ser um número inteiro positivo.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const litros = parseFloat(litrosInput.replace(',', '.'))
      const precoPorLitro = parseFloat(precoInput.replace(',', '.'))
      const kmAtual = kmAtualInput.trim() !== '' ? parseInt(kmAtualInput, 10) : undefined

      registrarAbastecimento({
        subtipo,
        litros,
        precoPorLitro,
        local: local.trim() !== '' ? local.trim() : undefined,
        kmAtual,
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-white text-2xl font-bold">Registrar Abastecimento</Text>

      {/* Subtipo toggle */}
      <View className="gap-2">
        <Text className="text-sm text-gray-400 font-medium">Tipo de combustível</Text>
        <View className="flex-row gap-3">
          {SUBTIPOS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSubtipo(opt.value)}
              className={`flex-1 min-h-[44px] rounded-xl border items-center justify-center ${
                subtipo === opt.value
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-surface'
              }`}
            >
              <Text
                className={`font-semibold text-base ${
                  subtipo === opt.value ? 'text-black' : 'text-white'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Input
        label="Litros abastecidos"
        value={litrosInput}
        onChangeText={setLitrosInput}
        keyboardType="decimal-pad"
        placeholder="Ex: 80,00"
        error={errors.litros}
      />

      <Input
        label="Preço por litro (R$)"
        value={precoInput}
        onChangeText={setPrecoInput}
        keyboardType="decimal-pad"
        placeholder="Ex: 6,50"
        error={errors.preco}
      />

      {/* Real-time total */}
      {valorTotalCentavos !== null && (
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-400 text-sm">Total calculado</Text>
            <Text className="text-primary font-bold text-lg">
              {centavosToReais(valorTotalCentavos)}
            </Text>
          </View>
        </Card>
      )}

      <Input
        label="Posto / Local (opcional)"
        value={local}
        onChangeText={setLocal}
        placeholder="Ex: Posto BR Km 210"
      />

      <Input
        label="KM atual (opcional)"
        value={kmAtualInput}
        onChangeText={setKmAtualInput}
        keyboardType="number-pad"
        placeholder="Ex: 12500"
        error={errors.kmAtual}
      />

      <FotoNota
        frotaId={frotaId}
        freteId={freteId}
        storagePath={fotoStoragePath}
        onFoto={setFotoStoragePath}
      />

      <Button
        label="Registrar abastecimento"
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
