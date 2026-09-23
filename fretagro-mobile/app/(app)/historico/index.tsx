// app/(app)/historico/index.tsx
// US5: the driver's closed trips.
//
// Grouped by settlement state rather than shown as one flat list: what the
// driver comes here for is "which of my trips have been paid", and a date-
// ordered list with a status chip makes him read every row to answer it.
//
// Corporate proxy note: Supabase requests go through the app's normal HTTPS
// channel. Behind a corporate proxy (e.g. Netscope) the device must trust the
// proxy CA; the app needs no extra network configuration.
// Layer: app — may import from components/, hooks/, lib/.

import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../../lib/supabase/client'
import { Text } from '../../../components/ui/Text'
import { ListItem } from '../../../components/ui/ListItem'
import { Banner } from '../../../components/ui/Banner'
import { SyncStatus } from '../../../components/ui/SyncStatus'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonList } from '../../../components/ui/Skeleton'
import { formatDate, formatReais } from '../../../lib/utils/format'
import { space } from '../../../lib/theme'
import { makeStyles, useTheme } from '../../../lib/theme/ThemeProvider'
import type { Frete, StatusFrete } from '@fretagro/types'

type ChipTone = 'neutral' | 'done' | 'waiting'

const STATUS_CHIP: Partial<Record<StatusFrete, { label: string; tone: ChipTone }>> = {
  concluido: { label: 'Aguardando o dono da frota', tone: 'neutral' },
  acerto_pendente: { label: 'Aguardando pagamento', tone: 'waiting' },
  acerto_realizado: { label: 'Pago', tone: 'done' },
}

export default function HistoricoScreen() {
  const { colors } = useTheme()
  const styles = useStyles()
  const router = useRouter()
  const [fretes, setFretes] = useState<Frete[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorico = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setError(null)
    try {
      // RLS policy fretes_motorista_select already restricts rows to the
      // authenticated motorista's trips (via current_motorista_id()). No explicit
      // motoristaId filter — it would be wrong anyway, because fretes.motoristaId
      // is the Prisma CUID, not the Auth UUID.
      const { data, error: dbError } = await supabase
        .from('fretes')
        .select('*')
        .in('status', ['concluido', 'acerto_pendente', 'acerto_realizado'])
        .order('dataInicio', { ascending: false })

      if (dbError) throw dbError
      setFretes((data as Frete[]) ?? [])
    } catch {
      setError(
        'Não deu para buscar suas viagens agora. Isso costuma ser falta de sinal — nada do que você registrou se perdeu.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch on focus (e.g. returning right after encerrar a viagem) so a
  // just-synced trip appears without an app restart. Silent after the first
  // load, to avoid a full-screen spinner flash on every tab switch.
  const hasLoadedRef = useRef(false)
  useFocusEffect(
    useCallback(() => {
      fetchHistorico({ silent: hasLoadedRef.current })
      hasLoadedRef.current = true
    }, [fetchHistorico]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchHistorico({ silent: true })
    } finally {
      setRefreshing(false)
    }
  }, [fetchHistorico])

  const pagas = useMemo(
    () => fretes.filter((f) => f.status === 'acerto_realizado').length,
    [fretes],
  )

  const subtitle =
    fretes.length === 0
      ? undefined
      : `${fretes.length} ${fretes.length === 1 ? 'viagem' : 'viagens'} · ${pagas} ${pagas === 1 ? 'paga' : 'pagas'}`

  return (
    <View style={styles.screen}>
      <TopAppBar title="Minhas viagens" subtitle={subtitle} />

      {loading ? (
        <View style={styles.padded}>
          <SkeletonList rows={5} />
        </View>
      ) : error != null ? (
        <View style={styles.padded}>
          <Banner
            tone="waiting"
            message={error}
            action={{ label: 'Tentar novamente', onPress: () => fetchHistorico() }}
          />
        </View>
      ) : (
        <FlatList
          data={fretes}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          contentContainerStyle={
            fretes.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListHeaderComponent={<SyncStatus style={styles.sync} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surfaceContainer}
            />
          }
          renderItem={({ item }) => {
            const chip = STATUS_CHIP[item.status] ?? STATUS_CHIP.concluido!
            return (
              <ListItem
                headline={`${item.origem} → ${item.destino}`}
                supporting={formatDate(item.dataInicio)}
                figure={item.valorBruto > 0 ? formatReais(item.valorBruto) : undefined}
                chip={chip}
                onPress={() => router.push(`/(app)/historico/${item.id}`)}
              />
            )
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon="map-outline"
              title="Suas viagens aparecem aqui"
              description="Assim que você encerrar a primeira viagem, ela entra nesta lista com o quanto rendeu e se já foi paga."
              action={{
                label: 'Iniciar viagem',
                icon: 'play',
                onPress: () => router.push('/(app)/viagem/iniciar'),
              }}
            />
          }
        />
      )}
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  padded: {
    padding: space.base,
  },
  listContent: {
    paddingHorizontal: space.base,
    paddingBottom: space.xxl,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: space.base,
  },
  sync: {
    marginBottom: space.base,
  },
  separator: {
    height: space.sm,
  },
}))
