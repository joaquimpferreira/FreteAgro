// app/(app)/perfil.tsx
// US8: driver profile — name, WhatsApp, linked truck, commission rate, logout.
// Fetches the Motorista record and its Caminhao from Supabase using the session user ID.
// Logout clears the Zustand store and returns to login.
//
// Corporate proxy note (Netscope): Supabase HTTPS requests go through the system
// proxy via the React Native networking stack. No code change needed, but the
// device must trust the proxy CA certificate.
//
// Layer: app — imports from components/, hooks/, lib/auth/ and lib/supabase/ (data only).

import { useCallback, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { getSession } from '../../lib/auth/mobileAuth'
import * as mobileAuth from '../../lib/auth/mobileAuth'
import { supabase } from '../../lib/supabase/client'
import { useViagemStore } from '../../store/viagemStore'
import { Text } from '../../components/ui/Text'
import { Button } from '../../components/ui/Button'
import { Surface } from '../../components/ui/Surface'
import { DataRow } from '../../components/ui/DataRow'
import { Banner } from '../../components/ui/Banner'
import { SyncStatus } from '../../components/ui/SyncStatus'
import { TopAppBar } from '../../components/ui/TopAppBar'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'

interface PerfilData {
  nome: string
  whatsapp: string
  percentualComissao: number
  caminhao: { placa: string; modelo: string } | null
}

export default function PerfilScreen() {
  const styles = useStyles()
  const router = useRouter()

  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const fetchPerfil = useCallback(async () => {
    setError(null)
    try {
      const session = await getSession()
      if (!session) {
        router.replace('/(auth)/login')
        return
      }

      // caminhoes is a back-relation (FK is caminhoes.motoristaId), embedded via
      // Supabase nested select.
      const { data, error: fetchError } = await supabase
        .from('motoristas')
        .select('nome, whatsapp, percentualComissao, caminhoes(placa, modelo)')
        .eq('supabaseUserId', session.user.id)
        .single()

      if (fetchError) throw fetchError

      const caminhoes = data.caminhoes as Array<{ placa: string; modelo: string }> | null
      setPerfil({
        nome: data.nome,
        whatsapp: data.whatsapp,
        percentualComissao: data.percentualComissao,
        caminhao: Array.isArray(caminhoes) && caminhoes.length > 0 ? caminhoes[0] : null,
      })
    } catch {
      setError(
        'Não deu para buscar seus dados agora. Isso costuma ser falta de sinal.',
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  // Refetch on focus so a truck linked on the web panel shows up without an
  // app restart.
  useFocusEffect(
    useCallback(() => {
      fetchPerfil()
    }, [fetchPerfil]),
  )

  function handleLogout() {
    Alert.alert(
      'Sair do app?',
      'Seus registros ficam guardados. Você vai precisar do e-mail e da senha para entrar de novo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true)
            try {
              await mobileAuth.signOut()
              // Clear Zustand store and the MMKV-persisted trip (constitution M-State).
              useViagemStore.getState().hidratarFromStorage(null)
              router.replace('/(auth)/login')
            } catch {
              setLoggingOut(false)
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.')
            }
          },
        },
      ],
    )
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Perfil" subtitle={perfil?.nome} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SyncStatus />

        {loading ? (
          <SkeletonCard />
        ) : error != null ? (
          <Banner
            tone="waiting"
            message={error}
            action={{ label: 'Tentar novamente', onPress: fetchPerfil }}
          />
        ) : perfil != null ? (
          <>
            <Surface level={1} padding="lg" style={styles.card}>
              <Text role="titleMedium">Seus dados</Text>
              <View style={styles.rows}>
                <DataRow label="Nome" value={perfil.nome} />
                <DataRow label="WhatsApp" value={perfil.whatsapp} />
                <DataRow label="Sua comissão" value={`${perfil.percentualComissao}%`} />
              </View>
              <Text role="bodySmall" tone="faint">
                Para corrigir qualquer um destes dados, fale com o dono da frota — é ele
                quem altera no painel.
              </Text>
            </Surface>

            <Surface level={1} padding="lg" style={styles.card}>
              <Text role="titleMedium">Seu caminhão</Text>
              {perfil.caminhao != null ? (
                <View style={styles.rows}>
                  <DataRow label="Placa" value={perfil.caminhao.placa} />
                  <DataRow label="Modelo" value={perfil.caminhao.modelo} />
                </View>
              ) : (
                <Text role="bodyMedium" tone="waiting">
                  Nenhum caminhão vinculado ainda. Sem isso você não consegue abrir uma
                  viagem — peça ao dono da frota para vincular o seu.
                </Text>
              )}
            </Surface>
          </>
        ) : null}

        <Button
          label="Sair do app"
          icon="log-out-outline"
          onPress={handleLogout}
          variant="outlined"
          destructive
          loading={loggingOut}
          disabled={loggingOut}
          style={styles.logout}
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
    paddingBottom: space.xxl,
    gap: space.base,
  },
  card: {
    gap: space.base,
  },
  rows: {
    gap: space.sm,
  },
  logout: {
    marginTop: space.lg,
  },
}))
