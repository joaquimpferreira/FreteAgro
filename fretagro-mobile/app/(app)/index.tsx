// app/(app)/index.tsx
// US7: Home screen — active trip banner, pending acerto balance, offline indicator.
// All data sourced from MMKV-backed Zustand store or cached Supabase — visible
// offline within 2 s of app open (SC-003).
//
// Corporate proxy note (Netscope): useAcerto fetches from Supabase. The request
// goes through the system proxy automatically. If the proxy CA is not trusted by
// the device, the request will silently fail and the balance will show as R$ 0,00
// while loading. No code change is required — trust the proxy CA at the OS level.

import { View, Text, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useViagemAtiva } from '../../hooks/useViagemAtiva'
import { useAcerto } from '../../hooks/useAcerto'
import { Button } from '../../components/ui/Button'
import { OfflineBanner } from '../../components/ui/OfflineBanner'

/** Format centavos → "R$ 0,00" */
function formatReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function HomeScreen() {
  const router = useRouter()
  const { isViagemAtiva, tripRoute, pendenteSincronizacao } = useViagemAtiva()
  const { pendingBalance, loading: acertoLoading } = useAcerto()

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} className="flex-1 bg-background">
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }}
        contentContainerClassName="flex-grow px-6 py-12"
      >
        <View style={{ gap: 32 }} className="gap-8">
          {/* Header */}
          <View style={{ alignItems: 'center' }} className="items-center">
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: 'bold' }} className="text-3xl font-bold text-white">
              FreteAgro
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }} className="text-sm text-gray-500 mt-1">
              Painel do Motorista
            </Text>
          </View>

          {/* Active Trip Banner */}
          <View
            style={{ backgroundColor: '#161616', borderRadius: 12, padding: 20, gap: 16 }}
            className="bg-surface rounded-xl p-5 gap-4"
          >
            <Text
              style={{ color: '#d1d5db', fontSize: 16, fontWeight: '600' }}
              className="text-base font-semibold text-gray-300"
            >
              Viagem
            </Text>

            {isViagemAtiva ? (
              <>
                <Text
                  style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}
                  className="text-white text-lg font-bold"
                >
                  Viagem em andamento
                </Text>

                {tripRoute != null && (
                  <Text
                    style={{ color: '#9ca3af', fontSize: 14 }}
                    className="text-gray-400 text-sm"
                    numberOfLines={1}
                  >
                    {tripRoute}
                  </Text>
                )}

                {pendenteSincronizacao && (
                  <Text style={{ color: '#facc15', fontSize: 12 }} className="text-yellow-400 text-xs">
                    Dados pendentes de sincronização
                  </Text>
                )}

                <Button
                  onPress={() => router.push('/(app)/viagem/em-curso')}
                  variant="primary"
                  label="Continuar viagem"
                />
              </>
            ) : (
              <>
                <Text style={{ color: '#9ca3af' }} className="text-gray-400">
                  Nenhuma viagem em andamento.
                </Text>
                <Button
                  onPress={() => router.push('/(app)/viagem/iniciar')}
                  variant="primary"
                  label="Iniciar viagem"
                />
              </>
            )}
          </View>

          {/* Pending Acerto Balance */}
          <View
            style={{ backgroundColor: '#161616', borderRadius: 12, padding: 20, gap: 12 }}
            className="bg-surface rounded-xl p-5 gap-3"
          >
            <Text
              style={{ color: '#d1d5db', fontSize: 16, fontWeight: '600' }}
              className="text-base font-semibold text-gray-300"
            >
              Meu Acerto
            </Text>

            {acertoLoading ? (
              <Text style={{ color: '#6b7280', fontSize: 14 }} className="text-gray-500 text-sm">
                Carregando...
              </Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} className="flex-row justify-between">
                  <Text style={{ color: '#9ca3af', fontSize: 14 }} className="text-gray-400 text-sm">
                    Comissão bruta
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 14 }} className="text-white text-sm">
                    {formatReais(pendingBalance.valorComissao)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} className="flex-row justify-between">
                  <Text style={{ color: '#9ca3af', fontSize: 14 }} className="text-gray-400 text-sm">
                    Deduções
                  </Text>
                  <Text style={{ color: '#f87171', fontSize: 14 }} className="text-red-400 text-sm">
                    -{formatReais(pendingBalance.totalDeducoes)}
                  </Text>
                </View>

                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 12, marginTop: 4 }}
                  className="flex-row justify-between border-t border-gray-700 pt-3 mt-1"
                >
                  <Text style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600' }} className="text-gray-300 text-base font-semibold">
                    A receber
                  </Text>
                  <Text style={{ color: '#22c55e', fontSize: 15, fontWeight: 'bold' }} className="text-green-500 text-base font-bold">
                    {formatReais(pendingBalance.saldoFinal)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

