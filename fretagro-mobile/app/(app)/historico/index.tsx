// app/(app)/historico/index.tsx
// US5: Trip history — list of closed trips for the current motorista.
// Fetches from Supabase: fretes where motoristaId = session user, status = concluido.
// Corporate proxy note: Supabase requests go through the app's normal HTTPS channel.
// If behind a corporate proxy (e.g. Netscope), ensure the device trusts the proxy CA;
// the app itself does not need any additional network configuration.
// Layer: app — may import from components/, hooks/, lib/ (only via mobileAuth).

import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase/client'
import { OfflineBanner } from '../../../components/ui/OfflineBanner'
import { Badge } from '../../../components/ui/Badge'
import type { Frete, StatusFrete } from '@fretagro/types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ACERTO_STATUS_LABELS: Partial<Record<StatusFrete, string>> = {
  concluido: 'Pendente',
  acerto_pendente: 'Pendente',
  acerto_realizado: 'Realizado',
}

const ACERTO_STATUS_VARIANT: Partial<Record<StatusFrete, 'default' | 'success' | 'warning' | 'muted'>> = {
  concluido: 'muted',
  acerto_pendente: 'warning',
  acerto_realizado: 'success',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Row component
// ─────────────────────────────────────────────────────────────────────────────

interface FreteRowProps {
  frete: Frete
  onPress: (id: string) => void
}

function FreteRow({ frete, onPress }: FreteRowProps) {
  const statusLabel = ACERTO_STATUS_LABELS[frete.status] ?? 'Pendente'
  const statusVariant = ACERTO_STATUS_VARIANT[frete.status] ?? 'muted'

  return (
    <Pressable
      className="bg-surface rounded-xl px-4 py-3 mb-3 min-h-[60px] flex-row items-center justify-between active:opacity-70"
      onPress={() => onPress(frete.id)}
      accessibilityRole="button"
      accessibilityLabel={`Viagem ${frete.origem} para ${frete.destino}`}
    >
      <View className="flex-1 gap-1">
        <Text className="text-white font-semibold text-base">
          {frete.origem} → {frete.destino}
        </Text>
        <Text className="text-gray-400 text-sm">{formatDate(frete.dataInicio)}</Text>
      </View>
      <Badge label={statusLabel} variant={statusVariant} />
    </Pressable>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function HistoricoScreen() {
  const router = useRouter()
  const [fretes, setFretes] = useState<Frete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorico = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // RLS policy fretes_motorista_select already restricts rows to the
      // authenticated motorista's trips (via current_motorista_id()). No
      // explicit motoristaId filter needed — and it would be wrong anyway
      // because fretes.motoristaId is the Prisma CUID, not the Auth UUID.
      const { data, error: dbError } = await supabase
        .from('fretes')
        .select('*')
        .in('status', ['concluido', 'acerto_pendente', 'acerto_realizado'])
        .order('dataInicio', { ascending: false })

      if (dbError) throw dbError
      setFretes((data as Frete[]) ?? [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar histórico'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistorico()
  }, [fetchHistorico])

  const handlePress = (id: string) => {
    router.push(`/(app)/historico/${id}`)
  }

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />
      <View className="flex-1 px-4 pt-4">
        <Text className="text-white text-2xl font-bold mb-4">Histórico</Text>

        {loading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22C55E" />
          </View>
        )}

        {!loading && error && (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-red-400 text-center">{error}</Text>
            <Pressable
              className="bg-primary rounded-xl px-6 py-3 min-h-[44px] items-center justify-center"
              onPress={fetchHistorico}
            >
              <Text className="text-black font-semibold">Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={fretes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FreteRow frete={item} onPress={handlePress} />}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-20 gap-3">
                <Text className="text-white text-lg font-semibold">Nenhuma viagem concluída</Text>
                <Text className="text-gray-500 text-center">
                  Após encerrar uma viagem ela aparecerá aqui.
                </Text>
              </View>
            }
            contentContainerStyle={fretes.length === 0 ? { flex: 1 } : undefined}
          />
        )}
      </View>
    </View>
  )
}
