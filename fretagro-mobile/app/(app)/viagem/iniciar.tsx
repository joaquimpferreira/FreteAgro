// app/(app)/viagem/iniciar.tsx
// Start Trip screen — collects trip details and opens the first vazio leg.
// Blocks if an active trip already exists (FR-010) or driver has no truck (FR-009).
// Layer: app — imports from hooks/, components/, lib/auth/, lib/supabase/.

import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import { getSession } from '../../../lib/auth/mobileAuth'
import { supabase } from '../../../lib/supabase/client'
import type { TipoCarga } from '@fretagro/types'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

const TIPOS_CARGA: { value: TipoCarga; label: string }[] = [
  { value: 'grao', label: 'Grão' },
  { value: 'oleo_soja', label: 'Óleo de soja' },
  { value: 'farelo', label: 'Farelo' },
  { value: 'fertilizante', label: 'Fertilizante' },
  { value: 'outro', label: 'Outro' },
]

interface DriverProfile {
  caminhaoId: string | null
  motoristaId: string
  frotaId: string
}

export default function IniciarViagem() {
  const viagem = useViagemStore((s) => s.viagem)
  const iniciarViagem = useViagemStore((s) => s.iniciarViagem)

  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [origem, setOrigem] = useState('')
  const [destino, setDestino] = useState('')
  const [tipoCarga, setTipoCarga] = useState<TipoCarga>('grao')
  const [kmInicial, setKmInicial] = useState('')
  const [valorBrutoInput, setValorBrutoInput] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const session = await getSession()
        if (!session) {
          setProfileError('Sessão não encontrada. Faça login novamente.')
          setLoadingProfile(false)
          return
        }

        // Column names are camelCase (Prisma does not auto-convert to snake_case
        // without @map). supabaseUserId / frotaId match the DB exactly.
        // caminhao is a back-relation (FK is caminhoes.motoristaId), so we embed.
        const { data: motorista, error } = await supabase
          .from('motoristas')
          .select('id, frotaId, caminhoes(id)')
          .eq('supabaseUserId', session.user.id)
          .single()

        if (error) throw error

        const caminhoes = motorista.caminhoes as Array<{ id: string }> | null
        const caminhaoId =
          Array.isArray(caminhoes) && caminhoes.length > 0
            ? caminhoes[0].id
            : null

        setProfile({
          motoristaId: motorista.id,
          frotaId: motorista.frotaId,
          caminhaoId,
        })
      } catch (err) {
        setProfileError('Não foi possível carregar o perfil do motorista.')
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  // FR-010: block if active trip exists
  if (viagem) {
    return (
      <View className="flex-1 bg-background px-4 items-center justify-center">
        <Card className="items-center gap-4">
          <Text className="text-white text-lg font-semibold text-center">
            Viagem em andamento
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            Encerre a viagem atual antes de iniciar uma nova.
          </Text>
          <Button
            label="Ir para viagem atual"
            onPress={() => router.replace('/(app)/viagem/em-curso')}
          />
        </Card>
      </View>
    )
  }

  if (loadingProfile) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Carregando perfil…</Text>
      </View>
    )
  }

  if (profileError) {
    return (
      <View className="flex-1 bg-background px-4 items-center justify-center">
        <Text className="text-red-400 text-center">{profileError}</Text>
      </View>
    )
  }

  // FR-009: block if driver has no truck assigned
  if (!profile?.caminhaoId) {
    return (
      <View className="flex-1 bg-background px-4 items-center justify-center">
        <Card className="items-center gap-3">
          <Text className="text-white text-lg font-semibold text-center">
            Nenhum caminhão vinculado
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            Solicite ao dono da frota que vincule um caminhão ao seu perfil para poder iniciar viagens.
          </Text>
        </Card>
      </View>
    )
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!origem.trim()) nextErrors.origem = 'Informe a origem.'
    if (!destino.trim()) nextErrors.destino = 'Informe o destino.'

    const kmNum = parseInt(kmInicial, 10)
    if (!kmInicial.trim() || isNaN(kmNum) || kmNum <= 0) {
      nextErrors.kmInicial = 'Km inicial deve ser um número maior que 0.'
    }

    if (valorBrutoInput.trim()) {
      const valorNum = parseFloat(valorBrutoInput.replace(',', '.'))
      if (isNaN(valorNum) || valorNum < 0) {
        nextErrors.valorBruto = 'Valor da Carta Frete inválido.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate() || !profile) return
    setSubmitting(true)

    const kmNum = parseInt(kmInicial, 10)
    const valorBrutoReais = valorBrutoInput.trim()
      ? parseFloat(valorBrutoInput.replace(',', '.'))
      : 0
    const valorBrutoCentavos = Math.round(valorBrutoReais * 100)

    try {
      iniciarViagem({
        origem: origem.trim(),
        destino: destino.trim(),
        tipoCarga,
        kmInicial: kmNum,
        valorBruto: valorBrutoCentavos,
        caminhaoId: profile.caminhaoId!,
        motoristaId: profile.motoristaId,
        frotaId: profile.frotaId,
      })
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.replace('/(app)/viagem/em-curso')
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível iniciar a viagem.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-4"
    >
      <Text className="text-white text-2xl font-bold">Iniciar viagem</Text>

      <Input
        label="Origem"
        value={origem}
        onChangeText={setOrigem}
        placeholder="Ex: Maringá, PR"
        error={errors.origem}
      />

      <Input
        label="Destino"
        value={destino}
        onChangeText={setDestino}
        placeholder="Ex: São Paulo, SP"
        error={errors.destino}
      />

      {/* Tipo de carga picker */}
      <View className="gap-1">
        <Text className="text-sm text-gray-400 font-medium">Tipo de carga</Text>
        <View className="flex-row flex-wrap gap-2">
          {TIPOS_CARGA.map((tc) => (
            <Button
              key={tc.value}
              label={tc.label}
              onPress={() => setTipoCarga(tc.value)}
              variant={tipoCarga === tc.value ? 'primary' : 'secondary'}
            />
          ))}
        </View>
      </View>

      <Input
        label="Km inicial"
        value={kmInicial}
        onChangeText={setKmInicial}
        placeholder="Ex: 120500"
        keyboardType="numeric"
        error={errors.kmInicial}
      />

      <View className="gap-1">
        <Input
          label="Valor da Carta Frete (R$)"
          value={valorBrutoInput}
          onChangeText={setValorBrutoInput}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={errors.valorBruto}
        />
        <Text className="text-xs text-gray-500">
          Valor da Carta Frete. Deixe em branco para R$ 0,00.
        </Text>
      </View>

      <Button
        label="Iniciar viagem"
        onPress={handleSubmit}
        loading={submitting}
        variant="primary"
      />
    </ScrollView>
  )
}
