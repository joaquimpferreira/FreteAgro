// app/(app)/viagem/iniciar.tsx
// Start Trip — collects trip details and opens the first vazio leg.
// Blocks when an active trip already exists (FR-010) or the driver has no
// truck linked (FR-009).
// Layer: app — imports from store/, components/, lib/auth/, lib/supabase/.

import { useState, useCallback } from 'react'
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useViagemStore } from '../../../store/viagemStore'
import { getSession } from '../../../lib/auth/mobileAuth'
import { supabase } from '../../../lib/supabase/client'
import type { TipoCarga } from '@fretagro/types'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { ChoiceChips } from '../../../components/ui/ChoiceChips'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Banner } from '../../../components/ui/Banner'
import { space } from '../../../lib/theme'
import { makeStyles, useTheme } from '../../../lib/theme/ThemeProvider'

const TIPOS_CARGA: readonly { value: TipoCarga; label: string }[] = [
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
  const { colors } = useTheme()
  const styles = useStyles()
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

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true)
    setProfileError(null)
    try {
      const session = await getSession()
      if (!session) {
        setProfileError('Sua sessão expirou. Entre novamente para iniciar a viagem.')
        setLoadingProfile(false)
        return
      }

      // Column names are camelCase (Prisma does not auto-convert to snake_case
      // without @map). caminhoes is a back-relation (FK is caminhoes.motoristaId).
      const { data: motorista, error } = await supabase
        .from('motoristas')
        .select('id, frotaId, caminhoes(id)')
        .eq('supabaseUserId', session.user.id)
        .single()

      if (error) throw error

      const caminhoes = motorista.caminhoes as Array<{ id: string }> | null
      setProfile({
        motoristaId: motorista.id,
        frotaId: motorista.frotaId,
        caminhaoId: Array.isArray(caminhoes) && caminhoes.length > 0 ? caminhoes[0].id : null,
      })
    } catch {
      setProfileError(
        'Não foi possível carregar seu perfil. Verifique o sinal e toque em Tentar novamente.',
      )
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  // Refetch on focus so a truck linked on the web panel shows up without an
  // app restart.
  useFocusEffect(
    useCallback(() => {
      fetchProfile()
    }, [fetchProfile]),
  )

  // FR-010: an active trip blocks a new one.
  if (viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Iniciar viagem" onBack={() => router.back()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Você já tem uma viagem aberta"
          description="Encerre a viagem atual antes de abrir outra. Só pode haver uma por vez."
          action={{
            label: 'Ir para a viagem atual',
            icon: 'arrow-forward',
            onPress: () => router.replace('/(app)/viagem/em-curso'),
          }}
        />
      </View>
    )
  }

  if (loadingProfile) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Iniciar viagem" onBack={() => router.back()} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text role="bodyMedium" tone="variant">
            Carregando seu perfil…
          </Text>
        </View>
      </View>
    )
  }

  if (profileError != null) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Iniciar viagem" onBack={() => router.back()} />
        <View style={styles.padded}>
          <Banner
            message={profileError}
            action={{ label: 'Tentar novamente', onPress: fetchProfile }}
          />
        </View>
      </View>
    )
  }

  // FR-009: no truck linked, no trip.
  if (profile?.caminhaoId == null) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Iniciar viagem" onBack={() => router.back()} />
        <EmptyState
          icon="bus-outline"
          title="Nenhum caminhão vinculado"
          description="Peça ao dono da frota para vincular um caminhão ao seu perfil. Sem isso a viagem não pode ser aberta."
          action={{
            label: 'Verificar novamente',
            icon: 'refresh',
            onPress: fetchProfile,
          }}
        />
      </View>
    )
  }

  function validate(): boolean {
    const next: Record<string, string> = {}

    if (!origem.trim()) next.origem = 'Informe de onde você está saindo.'
    if (!destino.trim()) next.destino = 'Informe para onde você vai.'

    const kmNum = parseInt(kmInicial, 10)
    if (!kmInicial.trim() || isNaN(kmNum) || kmNum <= 0) {
      next.kmInicial = 'Leia o km no painel do caminhão e digite só os números.'
    }

    if (valorBrutoInput.trim()) {
      const valorNum = parseFloat(valorBrutoInput.replace(',', '.'))
      if (isNaN(valorNum) || valorNum < 0) {
        next.valorBruto = 'Valor inválido. Use vírgula para os centavos, ex: 8500,00.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate() || !profile) return
    setSubmitting(true)

    const kmNum = parseInt(kmInicial, 10)
    const valorBrutoReais = valorBrutoInput.trim()
      ? parseFloat(valorBrutoInput.replace(',', '.'))
      : 0

    try {
      iniciarViagem({
        origem: origem.trim(),
        destino: destino.trim(),
        tipoCarga,
        kmInicial: kmNum,
        valorBruto: Math.round(valorBrutoReais * 100),
        caminhaoId: profile.caminhaoId!,
        motoristaId: profile.motoristaId,
        frotaId: profile.frotaId,
      })
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      router.replace('/(app)/viagem/em-curso')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível abrir a viagem. Tente novamente.'
      Alert.alert('Erro', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Iniciar viagem" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text role="bodyMedium" tone="variant">
          O km de saída é o que garante o seu acerto no final. Confira no painel antes
          de digitar.
        </Text>

        <TextField
          label="Saindo de"
          value={origem}
          onChangeText={setOrigem}
          placeholder="Ex: Sorriso, MT"
          error={errors.origem}
        />

        <TextField
          label="Indo para"
          value={destino}
          onChangeText={setDestino}
          placeholder="Ex: Rondonópolis, MT"
          error={errors.destino}
        />

        <ChoiceChips
          label="Tipo de carga"
          choices={TIPOS_CARGA}
          value={tipoCarga}
          onChange={setTipoCarga}
        />

        <TextField
          label="Km de saída"
          value={kmInicial}
          onChangeText={setKmInicial}
          placeholder="120500"
          keyboardType="number-pad"
          suffix="km"
          hint="O número que está no painel agora."
          error={errors.kmInicial}
        />

        <TextField
          label="Valor da Carta Frete"
          value={valorBrutoInput}
          onChangeText={setValorBrutoInput}
          placeholder="0,00"
          keyboardType="decimal-pad"
          suffix="R$"
          hint="Deixe em branco se ainda não souber."
          error={errors.valorBruto}
        />

        <Button
          label="Abrir viagem"
          icon="play"
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.base,
  },
  padded: {
    padding: space.base,
  },
  submit: {
    marginTop: space.sm,
  },
}))
