// app/(app)/acerto/index.tsx
// US6: the driver's settlement — what he is owed now, and everything already paid.
// Read-only (FR-034): mobile never edits or creates an acerto.
//
// Corporate proxy note (Netscope): Supabase HTTPS requests go through the system
// proxy via the React Native networking stack. No code change needed, but the
// device must trust the proxy CA certificate.
//
// Layer: app — may import from components/, hooks/, lib/.

import { useCallback, useRef, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Text } from '../../../components/ui/Text'
import { Banner } from '../../../components/ui/Banner'
import { SyncStatus } from '../../../components/ui/SyncStatus'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { SaldoCard } from '../../../components/acerto/SaldoCard'
import { AcertoItem } from '../../../components/acerto/AcertoItem'
import { FreteAguardandoItem } from '../../../components/acerto/FreteAguardandoItem'
import { useAcerto } from '../../../hooks/useAcerto'
import { space } from '../../../lib/theme'
import { makeStyles, useTheme } from '../../../lib/theme/ThemeProvider'
import type { Acerto } from '@fretagro/types'

export default function AcertoScreen() {
  const { colors } = useTheme()
  const styles = useStyles()
  const router = useRouter()
  const {
    pendingBalance,
    pendingAcertos,
    awaitingAcertos,
    acertoHistory,
    loading,
    error,
    refresh,
  } = useAcerto()
  const [refreshing, setRefreshing] = useState(false)

  // Refetch on focus so a payment confirmed on the web dashboard (status →
  // realizado) or a newly opened acerto shows up without an app restart. Skip
  // the very first focus — the hook already fetches on mount.
  const hasFocusedRef = useRef(false)
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) refresh()
      hasFocusedRef.current = true
    }, [refresh]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  const hasAnyItem =
    awaitingAcertos.length > 0 || pendingAcertos.length > 0 || acertoHistory.length > 0

  return (
    <View style={styles.screen}>
      <TopAppBar title="Meu acerto" />

      <FlatList<Acerto>
        data={acertoHistory}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceContainer}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SyncStatus />

            {loading ? (
              <SkeletonCard />
            ) : error != null ? (
              // The hook's `error` is a raw fetch message ("Network request
              // failed"). It is never shown: it is English, it is technical,
              // and it describes the transport rather than what the driver
              // should do. The tone is `waiting`, not `error` — on this
              // product the overwhelming cause is no signal, which is a normal
              // condition here, not something he did wrong.
              <Banner
                tone="waiting"
                message="Não deu para buscar seu acerto agora. Isso costuma ser falta de sinal — seus registros continuam guardados no aparelho."
                action={{ label: 'Tentar novamente', onPress: refresh }}
              />
            ) : (
              <SaldoCard balance={pendingBalance} />
            )}

            {/* Concluded trips the owner has not opened a settlement for yet. */}
            {!loading && awaitingAcertos.length > 0 && (
              <View style={styles.section}>
                <Text role="titleMedium" tone="variant">
                  Viagens aguardando acerto
                </Text>
                {awaitingAcertos.map((item) => (
                  <FreteAguardandoItem key={item.id} frete={item} />
                ))}
              </View>
            )}

            {/* Value confirmed by the owner, payment not yet made. */}
            {!loading && pendingAcertos.length > 0 && (
              <View style={styles.section}>
                <Text role="titleMedium" tone="variant">
                  Acertos abertos
                </Text>
                {pendingAcertos.map((item) => (
                  <AcertoItem
                    key={item.id}
                    acerto={item}
                    onPress={(id) => router.push(`/(app)/acerto/${id}`)}
                  />
                ))}
              </View>
            )}

            {!loading && acertoHistory.length > 0 && (
              <Text role="titleMedium" tone="variant" style={styles.historyHeading}>
                Já pagos
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <AcertoItem acerto={item} onPress={(id) => router.push(`/(app)/acerto/${id}`)} />
        )}
        ListEmptyComponent={
          // Never alongside the failure banner: "nothing here yet" and "we
          // could not load it" contradict each other, and only one of them is
          // known to be true.
          !loading && error == null && !hasAnyItem ? (
            <EmptyState
              icon="cash-outline"
              title="Seu acerto aparece aqui"
              description="Quando você encerrar uma viagem, ela entra nesta tela com a comissão estimada. O dono da frota confirma o valor e marca o pagamento."
            />
          ) : null
        }
      />
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
  },
  header: {
    gap: space.base,
    marginBottom: space.base,
  },
  section: {
    gap: space.sm,
    marginTop: space.sm,
  },
  historyHeading: {
    marginTop: space.sm,
  },
  separator: {
    height: space.sm,
  },
}))
