// app/(app)/acerto/index.tsx
// US6: Driver acerto (financial settlement) — pending balance and history.
// Shows SaldoCard with aggregated pending balance; FlatList of settled acertos.
// Read-only (FR-034) — no edit or new-acerto actions permitted in mobile.
//
// Corporate proxy note (Netscope): All Supabase HTTPS requests go through the
// system proxy automatically via the React Native networking stack. No code
// changes are needed, but the device must trust the proxy CA certificate.
//
// Layer: app — may import from components/, hooks/, lib/ (only via mobileAuth for auth)

import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { OfflineBanner } from '../../../components/ui/OfflineBanner'
import { SaldoCard } from '../../../components/acerto/SaldoCard'
import { AcertoItem } from '../../../components/acerto/AcertoItem'
import { FreteAguardandoItem } from '../../../components/acerto/FreteAguardandoItem'
import { useAcerto } from '../../../hooks/useAcerto'
import type { Acerto } from '@fretagro/types'

export default function AcertoScreen() {
  const router = useRouter()
  const { pendingBalance, pendingAcertos, awaitingAcertos, acertoHistory, loading, error } = useAcerto()

  function handlePressAcerto(id: string) {
    router.push(`/(app)/acerto/${id}`)
  }

  const hasAnyItem = awaitingAcertos.length > 0 || pendingAcertos.length > 0 || acertoHistory.length > 0

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <FlatList<Acerto>
        data={acertoHistory}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="gap-4 mb-4">
            <Text className="text-white text-2xl font-bold">Meu Acerto</Text>

            {/* Pending balance card */}
            {loading ? (
              <ActivityIndicator color="#22C55E" />
            ) : error ? (
              <View className="bg-surface rounded-xl p-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            ) : (
              <SaldoCard balance={pendingBalance} />
            )}

            {/* Concluded fretes awaiting acerto from fleet owner */}
            {!loading && awaitingAcertos.length > 0 && (
              <>
                <Text className="text-gray-400 text-sm font-medium uppercase tracking-wide mt-2">
                  Aguardando acerto
                </Text>
                {awaitingAcertos.map((item) => (
                  <FreteAguardandoItem key={item.id} frete={item} />
                ))}
              </>
            )}

            {/* Pending acertos — value confirmed by fleet owner, payment not yet made */}
            {!loading && pendingAcertos.length > 0 && (
              <>
                <Text className="text-gray-400 text-sm font-medium uppercase tracking-wide mt-2">
                  A Receber
                </Text>
                {pendingAcertos.map((item) => (
                  <AcertoItem key={item.id} acerto={item} onPress={handlePressAcerto} />
                ))}
              </>
            )}

            {/* History section header */}
            {!loading && acertoHistory.length > 0 && (
              <Text className="text-gray-400 text-sm font-medium uppercase tracking-wide mt-2">
                Histórico de Acertos
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <AcertoItem acerto={item} onPress={handlePressAcerto} />
        )}
        ListEmptyComponent={
          !loading && !hasAnyItem ? (
            <View className="items-center py-8 gap-2">
              <Text className="text-gray-500 text-center">
                Nenhum acerto registrado ainda.
              </Text>
              <Text className="text-gray-600 text-sm text-center">
                Seus acertos financeiros aparecerão aqui após serem registrados pelo dono da frota.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}
