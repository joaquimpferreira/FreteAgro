// app/(app)/historico/[id].tsx
// US5: Trip detail — trechos, expenses, refuels, and optional acerto summary.
//
// Corporate proxy note (Netscope): All Supabase HTTPS requests go through the
// system proxy automatically via the React Native networking stack. No code
// changes are needed, but the device must trust the proxy CA certificate.
// Signed URLs for private storage buckets are generated at render time (3600 s)
// and are never stored in DB — only storage paths are persisted (see T034).
//
// Layer: app — may import from components/, hooks/, lib/ (only via mobileAuth for auth).

import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase/client'
import { OfflineBanner } from '../../../components/ui/OfflineBanner'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { DespesaItem } from '../../../components/despesas/DespesaItem'
import type { Frete, Lancamento } from '@fretagro/types'
import type { TrechoKm, Abastecimento } from '@fretagro/types'
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

/**
 * Compute diesel economy for a leg:
 *   mediaDiesel = kmRodado / totalLitrosDiesel
 * Only diesel abastecimentos linked to this trecho are used (not arla).
 */
function calcularMediaDiesel(
  trecho: TrechoKm,
  abastecimentos: Abastecimento[],
): number | null {
  if (!trecho.kmRodado) return null
  const litros = abastecimentos
    .filter((a) => a.trechoId === trecho.id && a.subtipo === 'diesel')
    .reduce((sum, a) => sum + a.litros, 0)
  if (litros === 0) return null
  return trecho.kmRodado / litros
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface TrechoRowProps {
  trecho: TrechoKm
  abastecimentos: Abastecimento[]
}

function TrechoRow({ trecho, abastecimentos }: TrechoRowProps) {
  const mediaDiesel = calcularMediaDiesel(trecho, abastecimentos)
  const isClosed = trecho.fechadoEm != null

  return (
    <View className={`rounded-xl px-4 py-3 mb-2 ${isClosed ? 'bg-surface' : 'bg-surface border border-primary'}`}>
      <View className="flex-row items-center gap-2 mb-1">
        <Badge
          label={trecho.tipo === 'vazio' ? 'Vazio' : 'Carregado'}
          variant={trecho.tipo === 'vazio' ? 'muted' : 'warning'}
        />
        {!isClosed && <Badge label="Em andamento" variant="success" />}
      </View>
      <Text className="text-gray-400 text-sm">
        Início: {trecho.kmInicial.toLocaleString('pt-BR')} km
      </Text>
      {isClosed && trecho.kmFinal != null && (
        <Text className="text-gray-400 text-sm">
          Fim: {trecho.kmFinal.toLocaleString('pt-BR')} km
        </Text>
      )}
      {isClosed && trecho.kmRodado != null && (
        <Text className="text-white font-semibold text-sm">
          Rodado: {trecho.kmRodado.toLocaleString('pt-BR')} km
        </Text>
      )}
      {mediaDiesel != null && (
        <Text className="text-green-400 text-sm">
          Média diesel: {mediaDiesel.toFixed(2)} km/L
        </Text>
      )}
    </View>
  )
}

interface AcertoSummaryProps {
  acerto: Acerto
}

function AcertoSummary({ acerto }: AcertoSummaryProps) {
  return (
    <Card>
      <Text className="text-white font-bold text-base mb-2">Acerto</Text>
      <View className="gap-1">
        <View className="flex-row justify-between">
          <Text className="text-gray-400 text-sm">Comissão bruta</Text>
          <Text className="text-white text-sm">{centavosToReais(acerto.valorComissao)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-400 text-sm">Deduções</Text>
          <Text className="text-red-400 text-sm">−{centavosToReais(acerto.totalDeducoes)}</Text>
        </View>
        <View className="flex-row justify-between mt-1 pt-1 border-t border-surface">
          <Text className="text-white font-semibold text-sm">A receber</Text>
          <Text className="text-green-400 font-bold text-sm">
            {centavosToReais(acerto.saldoFinal)}
          </Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-gray-400 text-sm">Status</Text>
          <Badge
            label={acerto.status === 'realizado' ? 'Realizado' : 'Pendente'}
            variant={acerto.status === 'realizado' ? 'success' : 'warning'}
          />
        </View>
        {acerto.realizadoEm && (
          <Text className="text-gray-500 text-xs mt-1">
            Liquidado em {formatDate(acerto.realizadoEm)}
          </Text>
        )}
      </View>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

interface DetailData {
  frete: Frete
  trechos: TrechoKm[]
  lancamentos: Lancamento[]
  abastecimentos: Abastecimento[]
  acerto: Acerto | null
  // Map from storage path → signed URL resolved at render time
  signedUrls: Record<string, string>
}

export default function HistoricoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Resolve signed URLs for all storage paths found in lancamentos and abastecimentos.
   * Storage paths are NEVER signed URLs — they are resolved here at render time (T034).
   */
  const resolveSignedUrls = useCallback(
    async (paths: string[]): Promise<Record<string, string>> => {
      const uniquePaths = [...new Set(paths.filter(Boolean))]
      if (uniquePaths.length === 0) return {}

      const results: Record<string, string> = {}
      await Promise.all(
        uniquePaths.map(async (path) => {
          try {
            const { data: urlData, error: urlError } = await supabase.storage
              .from('recibos')
              .createSignedUrl(path, 3600)
            if (!urlError && urlData?.signedUrl) {
              results[path] = urlData.signedUrl
            }
          } catch {
            // Non-fatal: photo will just not render
          }
        }),
      )
      return results
    },
    [],
  )

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: freteData, error: freteErr },
        { data: trechosData, error: trechosErr },
        { data: lancamentosData, error: lancamentosErr },
        { data: abastecimentosData, error: abastecimentosErr },
        { data: acertosData, error: acertosErr },
      ] = await Promise.all([
        supabase.from('fretes').select('*').eq('id', id).single(),
        supabase
          .from('trechos_km')
          .select('*')
          .eq('freteId', id)
          .order('ordem', { ascending: true }),
        supabase.from('lancamentos').select('*').eq('freteId', id),
        supabase.from('abastecimentos').select('*').eq('freteId', id),
        supabase
          .from('acertos')
          .select('*')
          .eq('freteId', id)
          .order('createdAt', { ascending: false })
          .limit(1),
      ])

      if (freteErr) throw freteErr
      if (trechosErr) throw trechosErr
      if (lancamentosErr) throw lancamentosErr
      if (abastecimentosErr) throw abastecimentosErr
      if (acertosErr) throw acertosErr

      const lancamentos = (lancamentosData as Lancamento[]) ?? []
      const abastecimentos = (abastecimentosData as Abastecimento[]) ?? []

      // Collect all storage paths to resolve to signed URLs at render time
      const storagePaths: string[] = [
        ...lancamentos.map((l) => l.fotoUrl).filter((p): p is string => !!p),
        ...abastecimentos.map((a) => a.fotoUrl).filter((p): p is string => !!p),
      ]

      const signedUrls = await resolveSignedUrls(storagePaths)

      setData({
        frete: freteData as Frete,
        trechos: (trechosData as TrechoKm[]) ?? [],
        lancamentos,
        abastecimentos,
        acerto: (acertosData as Acerto[])?.[0] ?? null,
        signedUrls,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar detalhe da viagem'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [id, resolveSignedUrls])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6 gap-3">
        <Text className="text-red-400 text-center">{error ?? 'Viagem não encontrada'}</Text>
        <Pressable
          className="bg-surface rounded-xl px-6 py-3 min-h-[44px] items-center justify-center"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </Pressable>
      </View>
    )
  }

  const { frete, trechos, lancamentos, abastecimentos, acerto, signedUrls } = data

  const kmTotalVazio = trechos
    .filter((t) => t.tipo === 'vazio')
    .reduce((sum, t) => sum + (t.kmRodado ?? 0), 0)
  const kmTotalCarregado = trechos
    .filter((t) => t.tipo === 'carregado')
    .reduce((sum, t) => sum + (t.kmRodado ?? 0), 0)
  const kmTotalViagem = kmTotalVazio + kmTotalCarregado

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-8 gap-4">
        {/* Back */}
        <Pressable
          className="flex-row items-center gap-1 mb-1 min-h-[44px] self-start"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao histórico"
        >
          <Text className="text-primary text-base">← Histórico</Text>
        </Pressable>

        {/* Header */}
        <Card>
          <Text className="text-white font-bold text-lg">
            {frete.origem} → {frete.destino}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {formatDate(frete.dataInicio)}
            {frete.dataFim ? ` – ${formatDate(frete.dataFim)}` : ''}
          </Text>
          <Text className="text-gray-400 text-sm">Carga: {frete.tipoCarga}</Text>
          {frete.valorBruto > 0 && (
            <Text className="text-green-400 text-sm mt-1">
              Carta Frete: {centavosToReais(frete.valorBruto)}
            </Text>
          )}
        </Card>

        {/* KM Summary */}
        {kmTotalViagem > 0 && (
          <Card>
            <Text className="text-white font-bold text-base mb-2">Quilometragem</Text>
            <View className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Vazio</Text>
                <Text className="text-white text-sm">{kmTotalVazio.toLocaleString('pt-BR')} km</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Carregado</Text>
                <Text className="text-white text-sm">{kmTotalCarregado.toLocaleString('pt-BR')} km</Text>
              </View>
              <View className="flex-row justify-between pt-1 border-t border-surface mt-1">
                <Text className="text-white font-semibold text-sm">Total</Text>
                <Text className="text-white font-bold text-sm">{kmTotalViagem.toLocaleString('pt-BR')} km</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Trechos */}
        {trechos.length > 0 && (
          <View>
            <Text className="text-white font-bold text-base mb-2">
              Trechos ({trechos.length})
            </Text>
            {trechos.map((trecho) => (
              <TrechoRow
                key={trecho.id}
                trecho={trecho}
                abastecimentos={abastecimentos}
              />
            ))}
          </View>
        )}

        {/* Abastecimentos */}
        {abastecimentos.length > 0 && (
          <View>
            <Text className="text-white font-bold text-base mb-2">
              Abastecimentos ({abastecimentos.length})
            </Text>
            {abastecimentos.map((item) => (
              <DespesaItem
                key={item.id}
                kind="abastecimento"
                subtipo={item.subtipo}
                litros={item.litros}
                precoPorLitro={item.precoPorLitro}
                valor={item.valorTotal}
                descricao={item.local}
                signedPhotoUrl={item.fotoUrl ? signedUrls[item.fotoUrl] : undefined}
              />
            ))}
          </View>
        )}

        {/* Lancamentos */}
        {lancamentos.length > 0 && (
          <View>
            <Text className="text-white font-bold text-base mb-2">
              Despesas ({lancamentos.length})
            </Text>
            {lancamentos.map((item) => (
              <DespesaItem
                key={item.id}
                kind="lancamento"
                tipo={item.tipo}
                valor={item.valor}
                descricao={item.descricao}
                signedPhotoUrl={item.fotoUrl ? signedUrls[item.fotoUrl] : undefined}
              />
            ))}
          </View>
        )}

        {/* Acerto */}
        {acerto != null && acerto.status === 'realizado' && (
          <AcertoSummary acerto={acerto} />
        )}
      </ScrollView>
    </View>
  )
}
