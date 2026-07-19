// app/(app)/acerto/[id].tsx
// US6: Acerto detail screen — full settlement breakdown + optional receipt image.
//
// comprovanteUrl stored in DB is a private Supabase Storage path (e.g.
// 'comprovantes/{motoristaId}/{uuid}.pdf'). A signed URL is generated at render
// time via supabase.storage.from('comprovantes').createSignedUrl(path, 3600).
// The raw storage path is NEVER used directly as an image src (private bucket).
//
// Corporate proxy note (Netscope): All Supabase HTTPS requests (data + storage)
// go through the system proxy automatically via the React Native networking stack.
// No code changes are needed, but the device must trust the proxy CA certificate.
//
// Layer: app — may import from components/, hooks/, lib/ (only via mobileAuth for auth)

import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase/client'
import { OfflineBanner } from '../../../components/ui/OfflineBanner'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import type { Acerto } from '@fretagro/types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function centavosToReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface FinanceRowProps {
  label: string
  value: number
  emphasized?: boolean
  negative?: boolean
}

function FinanceRow({ label, value, emphasized = false, negative = false }: FinanceRowProps) {
  const textColor = negative
    ? 'text-red-400'
    : emphasized
      ? 'text-primary'
      : 'text-white'

  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className={`${emphasized ? 'font-bold text-base' : 'text-gray-400 text-sm'}`}>
        {label}
      </Text>
      <Text className={`font-semibold ${emphasized ? 'text-base' : 'text-sm'} ${textColor}`}>
        {centavosToReais(value)}
      </Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AcertoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [acerto, setAcerto] = useState<Acerto | null>(null)
  const [comprovanteSignedUrl, setComprovanteSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAcerto = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('acertos')
        .select(
          'id, valorFrete, percentualComissao, valorComissao, totalDeducoes, saldoFinal, status, comprovanteUrl, freteId, motoristaId, createdAt, realizadoEm',
        )
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      if (!data) throw new Error('Acerto não encontrado')

      const row = data as Acerto
      setAcerto(row)

      // Generate signed URL for private storage path — NEVER use path directly as src
      if (row.comprovanteUrl) {
        const { data: signedData, error: signError } = await supabase.storage
          .from('comprovantes')
          .createSignedUrl(row.comprovanteUrl, 3600)

        if (!signError && signedData?.signedUrl) {
          setComprovanteSignedUrl(signedData.signedUrl)
        }
        // If signing fails, we simply don't show the image — non-fatal
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar acerto'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAcerto()
  }, [fetchAcerto])

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <OfflineBanner />
        <ActivityIndicator color="#22C55E" size="large" />
      </View>
    )
  }

  if (error || !acerto) {
    return (
      <View className="flex-1 bg-background">
        <OfflineBanner />
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Text className="text-red-400 text-center">
            {error ?? 'Acerto não encontrado.'}
          </Text>
          <Pressable
            className="mt-4 min-h-[44px] bg-surface rounded-xl px-6 items-center justify-center"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const settledAt = acerto.realizadoEm ?? acerto.createdAt

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-4">
          <Pressable
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text className="text-primary text-base font-semibold">← Voltar</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-white text-2xl font-bold">Detalhe do Acerto</Text>
          <Badge label="Realizado" variant="success" />
        </View>
        <Text className="text-gray-400 text-sm mb-6">
          Realizado em {formatDate(settledAt)}
        </Text>

        {/* Financial breakdown */}
        <Card className="mb-4">
          <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Resumo Financeiro
          </Text>

          <FinanceRow label="Valor do frete" value={acerto.valorFrete} />
          <Text className="text-gray-600 text-xs mb-1">
            Comissão: {acerto.percentualComissao}%
          </Text>

          <View className="border-b border-gray-700 my-1" />

          <FinanceRow label="Comissão bruta" value={acerto.valorComissao} />
          <FinanceRow
            label="Deduções"
            value={acerto.totalDeducoes}
            negative={acerto.totalDeducoes > 0}
          />

          <View className="border-b border-gray-700 my-1" />

          <FinanceRow label="A receber" value={acerto.saldoFinal} emphasized />
        </Card>

        {/* Receipt / comprovante — displayed only when a signed URL is available */}
        {comprovanteSignedUrl && (
          <Card>
            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
              Comprovante
            </Text>
            <Image
              source={{ uri: comprovanteSignedUrl }}
              className="w-full rounded-xl"
              style={{ height: 240 }}
              resizeMode="contain"
              accessibilityLabel="Comprovante do acerto"
            />
          </Card>
        )}
      </ScrollView>
    </View>
  )
}
