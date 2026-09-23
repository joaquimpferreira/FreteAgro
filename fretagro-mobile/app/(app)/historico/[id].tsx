// app/(app)/historico/[id].tsx
// US5: trip detail — legs, refuels, expenses, and the settlement when it exists.
//
// Corporate proxy note (Netscope): Supabase HTTPS requests go through the system
// proxy via the React Native networking stack. No code change needed, but the
// device must trust the proxy CA. Signed URLs for private buckets are generated
// at render time (3600s) and never persisted — only storage paths are (T034).
//
// Layer: app — may import from components/, hooks/, lib/.

import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase/client'
import { Text } from '../../../components/ui/Text'
import { Surface } from '../../../components/ui/Surface'
import { Chip } from '../../../components/ui/Chip'
import { DataRow } from '../../../components/ui/DataRow'
import { Banner } from '../../../components/ui/Banner'
import { SyncStatus } from '../../../components/ui/SyncStatus'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { TrechoCard } from '../../../components/viagem/TrechoCard'
import { DespesaItem } from '../../../components/despesas/DespesaItem'
import { formatDate, formatKm, formatReais } from '../../../lib/utils/format'
import { space } from '../../../lib/theme'
import { makeStyles, useTheme } from '../../../lib/theme/ThemeProvider'
import type { Frete, Lancamento, TrechoKm, Abastecimento, Acerto } from '@fretagro/types'

const TIPO_CARGA_LABELS: Record<string, string> = {
  grao: 'Grão',
  oleo_soja: 'Óleo de soja',
  farelo: 'Farelo',
  fertilizante: 'Fertilizante',
  outro: 'Outro',
}

interface DetailData {
  frete: Frete
  trechos: TrechoKm[]
  lancamentos: Lancamento[]
  abastecimentos: Abastecimento[]
  acerto: Acerto | null
  /** storage path → signed URL, resolved at render time */
  signedUrls: Record<string, string>
}

export default function HistoricoDetailScreen() {
  const { colors } = useTheme()
  const styles = useStyles()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Storage paths are NEVER signed URLs — they are resolved here (T034). */
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
            // Non-fatal: the photo simply does not render.
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
        supabase.from('trechos_km').select('*').eq('freteId', id).order('ordem', { ascending: true }),
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

      const storagePaths: string[] = [
        ...lancamentos.map((l) => l.fotoUrl).filter((p): p is string => !!p),
        ...abastecimentos.map((a) => a.fotoUrl).filter((p): p is string => !!p),
      ]

      setData({
        frete: freteData as Frete,
        trechos: (trechosData as TrechoKm[]) ?? [],
        lancamentos,
        abastecimentos,
        acerto: (acertosData as Acerto[])?.[0] ?? null,
        signedUrls: await resolveSignedUrls(storagePaths),
      })
    } catch {
      setError(
        'Não foi possível carregar esta viagem. Verifique o sinal e toque em Tentar novamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [id, resolveSignedUrls])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  if (loading) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Viagem" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  if (error != null || data == null) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Viagem" onBack={() => router.back()} />
        <View style={styles.padded}>
          <Banner
            message={error ?? 'Esta viagem não foi encontrada.'}
            action={{ label: 'Tentar novamente', onPress: fetchDetail }}
          />
        </View>
      </View>
    )
  }

  const { frete, trechos, lancamentos, abastecimentos, acerto, signedUrls } = data

  const kmVazio = trechos
    .filter((t) => t.tipo === 'vazio')
    .reduce((sum, t) => sum + (t.kmRodado ?? 0), 0)
  const kmCarregado = trechos
    .filter((t) => t.tipo === 'carregado')
    .reduce((sum, t) => sum + (t.kmRodado ?? 0), 0)
  const kmTotal = kmVazio + kmCarregado

  const totalAbastecimentos = abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0)
  const totalDespesas = lancamentos.reduce((acc, l) => acc + l.valor, 0)

  const periodo =
    frete.dataFim != null
      ? `${formatDate(frete.dataInicio)} – ${formatDate(frete.dataFim)}`
      : formatDate(frete.dataInicio)

  return (
    <View style={styles.screen}>
      <TopAppBar
        title={`${frete.origem} → ${frete.destino}`}
        subtitle={periodo}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SyncStatus />

        <Surface level={1} padding="lg" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text role="titleMedium">A viagem</Text>
            <Chip
              label={TIPO_CARGA_LABELS[frete.tipoCarga] ?? frete.tipoCarga}
              tone="neutral"
              icon="cube-outline"
            />
          </View>
          <View style={styles.rows}>
            {frete.valorBruto > 0 && (
              <DataRow label="Carta Frete" value={formatReais(frete.valorBruto)} />
            )}
            {kmTotal > 0 && (
              <>
                <DataRow label="Km vazio" value={formatKm(kmVazio)} />
                <DataRow label="Km carregado" value={formatKm(kmCarregado)} />
                <DataRow
                  label="Total rodado"
                  value={formatKm(kmTotal)}
                  emphasis="positive"
                  divided
                />
              </>
            )}
          </View>
        </Surface>

        {trechos.length > 0 && (
          <View style={styles.section}>
            <Text role="titleMedium" tone="variant">
              {trechos.length} {trechos.length === 1 ? 'trecho' : 'trechos'}
            </Text>
            {trechos.map((trecho, idx) => (
              <TrechoCard
                key={trecho.id}
                trecho={trecho}
                abastecimentos={abastecimentos}
                numero={idx + 1}
              />
            ))}
          </View>
        )}

        {abastecimentos.length > 0 && (
          <View style={styles.section}>
            <Text role="titleMedium" tone="variant">
              Abastecimentos · {formatReais(totalAbastecimentos)}
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

        {lancamentos.length > 0 && (
          <View style={styles.section}>
            <Text role="titleMedium" tone="variant">
              Despesas · {formatReais(totalDespesas)}
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

        {acerto != null && acerto.status === 'realizado' && (
          <Surface level={1} padding="lg" style={styles.card}>
            <View style={styles.cardHeader}>
              <Text role="titleMedium">Acerto desta viagem</Text>
              <Chip label="Pago" tone="done" icon="checkmark-circle" />
            </View>
            <View style={styles.rows}>
              <DataRow label="Comissão bruta" value={formatReais(acerto.valorComissao)} />
              <DataRow label="Deduções" value={`− ${formatReais(acerto.totalDeducoes)}`} />
              <DataRow
                label="Você recebeu"
                value={formatReais(acerto.saldoFinal)}
                emphasis="positive"
                divided
              />
            </View>
            {acerto.realizadoEm != null && (
              <Text role="bodySmall" tone="faint">
                Pago em {formatDate(acerto.realizadoEm)}.
              </Text>
            )}
          </Surface>
        )}
      </ScrollView>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    padding: space.base,
  },
  content: {
    paddingHorizontal: space.base,
    paddingBottom: space.xxl,
    gap: space.base,
  },
  card: {
    gap: space.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  rows: {
    gap: space.sm,
  },
  section: {
    gap: space.sm,
  },
}))
