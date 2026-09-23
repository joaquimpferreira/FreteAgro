// app/(app)/acerto/[id].tsx
// US6: settlement detail — the full breakdown, and the receipt when there is one.
//
// The screen reads top-down as the arithmetic actually runs: freight value, the
// percentage applied to it, the gross commission, the deductions, the balance.
// PRODUCT.md records that the driver must be able to trace his own money; this
// screen is where that promise is kept.
//
// comprovanteUrl in the DB is a private Supabase Storage path. A signed URL is
// generated here at render time (3600s) — the raw path is NEVER used as an
// image source.
//
// Corporate proxy note (Netscope): Supabase HTTPS requests (data + storage) go
// through the system proxy. No code change needed, but the device must trust
// the proxy CA certificate.
//
// Layer: app — may import from components/, hooks/, lib/.

import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase/client'
import { Text } from '../../../components/ui/Text'
import { Surface } from '../../../components/ui/Surface'
import { Chip } from '../../../components/ui/Chip'
import { DataRow } from '../../../components/ui/DataRow'
import { Banner } from '../../../components/ui/Banner'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { formatDate, formatReais } from '../../../lib/utils/format'
import { shape, space } from '../../../lib/theme'
import { makeStyles, useTheme } from '../../../lib/theme/ThemeProvider'
import type { Acerto } from '@fretagro/types'

export default function AcertoDetailScreen() {
  const { colors } = useTheme()
  const styles = useStyles()
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
      if (!data) throw new Error('not-found')

      const row = data as Acerto
      setAcerto(row)

      // Signed URL for the private storage path — never use the path directly.
      if (row.comprovanteUrl) {
        const { data: signedData, error: signError } = await supabase.storage
          .from('comprovantes')
          .createSignedUrl(row.comprovanteUrl, 3600)

        if (!signError && signedData?.signedUrl) {
          setComprovanteSignedUrl(signedData.signedUrl)
        }
        // Signing failure is non-fatal: the breakdown still renders.
      }
    } catch {
      setError(
        'Não foi possível carregar este acerto. Verifique o sinal e toque em Tentar novamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAcerto()
  }, [fetchAcerto])

  if (loading) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Acerto" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  if (error != null || acerto == null) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Acerto" onBack={() => router.back()} />
        <View style={styles.padded}>
          <Banner
            message={error ?? 'Este acerto não foi encontrado.'}
            action={{ label: 'Tentar novamente', onPress: fetchAcerto }}
          />
        </View>
      </View>
    )
  }

  const pago = acerto.status === 'realizado'
  const settledAt = acerto.realizadoEm ?? acerto.createdAt

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Acerto"
        subtitle={pago ? `Pago em ${formatDate(settledAt)}` : `Aberto em ${formatDate(settledAt)}`}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Surface level={1} padding="lg" style={styles.hero}>
          <View style={styles.heroHeader}>
            <Text role="titleMedium" tone="variant">
              {pago ? 'Você recebeu' : 'A receber'}
            </Text>
            <Chip
              label={pago ? 'Pago' : 'Aguardando pagamento'}
              tone={pago ? 'done' : 'waiting'}
              icon={pago ? 'checkmark-circle' : 'hourglass-outline'}
            />
          </View>

          <Text role="figureLarge" tone="strong">
            {formatReais(acerto.saldoFinal)}
          </Text>
        </Surface>

        {/* The arithmetic, in the order it runs. */}
        <Surface level={1} padding="lg" style={styles.card}>
          <Text role="titleMedium">Como chegou nesse valor</Text>

          <View style={styles.rows}>
            <DataRow label="Valor do frete" value={formatReais(acerto.valorFrete)} />
            <DataRow label="Sua comissão" value={`${acerto.percentualComissao}%`} />
            <DataRow
              label="Comissão bruta"
              value={formatReais(acerto.valorComissao)}
              divided
            />
            <DataRow label="Deduções" value={`− ${formatReais(acerto.totalDeducoes)}`} />
            <DataRow
              label="A receber"
              value={formatReais(acerto.saldoFinal)}
              emphasis="positive"
              divided
            />
          </View>
        </Surface>

        {comprovanteSignedUrl != null && (
          <Surface level={1} padding="lg" style={styles.card}>
            <Text role="titleMedium">Comprovante</Text>
            <Image
              source={{ uri: comprovanteSignedUrl }}
              style={styles.comprovante}
              resizeMode="contain"
              accessibilityLabel="Comprovante do acerto"
            />
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
  hero: {
    gap: space.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  card: {
    gap: space.base,
  },
  rows: {
    gap: space.sm,
  },
  comprovante: {
    width: '100%',
    height: 260,
    borderRadius: shape.medium,
    backgroundColor: colors.surfaceContainerLowest,
  },
}))
