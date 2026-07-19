// app/(app)/perfil.tsx
// US8: Driver profile — nome, whatsapp, truck (placa + modelo), commission rate, and logout.
// Fetches Motorista record and linked Caminhao from Supabase using the active session user ID.
// Logout clears the Zustand store and redirects to the login screen.
//
// Corporate proxy note (Netscope): All Supabase HTTPS requests go through the
// system proxy automatically via the React Native networking stack. No code
// changes are needed, but the device must trust the proxy CA certificate.
//
// Layer: app — imports from components/, hooks/, lib/auth/ (via mobileAuth), lib/supabase/ (data only)

import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { getSession } from '../../lib/auth/mobileAuth'
import * as mobileAuth from '../../lib/auth/mobileAuth'
import { supabase } from '../../lib/supabase/client'
import { useViagemStore } from '../../store/viagemStore'
import { Button } from '../../components/ui/Button'
import { OfflineBanner } from '../../components/ui/OfflineBanner'

interface PerfilData {
  nome: string
  whatsapp: string
  percentualComissao: number
  caminhao: { placa: string; modelo: string } | null
}

export default function PerfilScreen() {
  const router = useRouter()

  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function fetchPerfil() {
      try {
        const session = await getSession()
        if (!session) {
          router.replace('/(auth)/login')
          return
        }

        // caminhoes is a back-relation (FK is caminhoes.motoristaId), embedded via Supabase nested select
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
        setError('Não foi possível carregar os dados do perfil.')
      } finally {
        setLoading(false)
      }
    }

    fetchPerfil()
  }, [])

  function handleLogout() {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true)
          try {
            await mobileAuth.signOut()
            // Clear Zustand store and MMKV persisted trip (constitution M-State)
            useViagemStore.getState().hidratarFromStorage(null)
            router.replace('/(auth)/login')
          } catch {
            setLoggingOut(false)
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.')
          }
        },
      },
    ])
  }

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center gap-2 mb-8">
          <Text className="text-3xl font-bold text-white">Perfil</Text>
          <Text className="text-sm text-gray-500">Dados da sua conta</Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#22C55E" />
          </View>
        ) : error ? (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </View>
        ) : perfil ? (
          <View className="gap-4">
            {/* Driver info */}
            <View className="bg-surface rounded-xl p-4 gap-4">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Dados Pessoais
              </Text>

              <View className="gap-1">
                <Text className="text-gray-500 text-xs">Nome</Text>
                <Text className="text-white text-base font-medium">{perfil.nome}</Text>
              </View>

              <View className="gap-1">
                <Text className="text-gray-500 text-xs">WhatsApp</Text>
                <Text className="text-white text-base font-medium">{perfil.whatsapp}</Text>
              </View>

              <View className="gap-1">
                <Text className="text-gray-500 text-xs">Comissão</Text>
                <Text className="text-white text-base font-medium">{perfil.percentualComissao}%</Text>
              </View>
            </View>

            {/* Truck info */}
            <View className="bg-surface rounded-xl p-4 gap-4">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Caminhão Vinculado
              </Text>

              {perfil.caminhao ? (
                <>
                  <View className="gap-1">
                    <Text className="text-gray-500 text-xs">Placa</Text>
                    <Text className="text-white text-base font-medium">{perfil.caminhao.placa}</Text>
                  </View>

                  <View className="gap-1">
                    <Text className="text-gray-500 text-xs">Modelo</Text>
                    <Text className="text-white text-base font-medium">{perfil.caminhao.modelo}</Text>
                  </View>
                </>
              ) : (
                <Text className="text-gray-500 text-sm">Nenhum caminhão vinculado</Text>
              )}
            </View>
          </View>
        ) : null}

        <View className="flex-1" />

        {/* Logout */}
        <View className="mt-8">
          <Button
            onPress={handleLogout}
            variant="destructive"
            label="Sair"
            loading={loggingOut}
            disabled={loggingOut}
          />
        </View>
      </ScrollView>
    </View>
  )
}
