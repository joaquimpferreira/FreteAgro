// app/(app)/index.tsx
// US7: Home — the open trip, and what the driver is owed.
//
// The screen answers two questions without scrolling, because the driver is
// reading it standing at a pump: is a trip open and what do I do next, and how
// much is coming to me. The trip block leads because it is the only one with an
// action; the balance follows as the screen's hero figure.
//
// The balance is set in `figureDisplay` — larger than anything else in the app
// — and in the primary-strong role rather than in body text. That is not
// emphasis for its own sake. PRODUCT.md records that the product exists to end
// the owner/driver pay dispute, and this number is the whole claim; a driver
// who cannot find it in a glance at arm's length in the sun does not have it.
//
// All data comes from the MMKV-backed store or cached Supabase, so it is on
// screen within 2s of app open (SC-003).
//
// Corporate proxy note (Netscope): useAcerto fetches from Supabase through the
// system proxy. If the proxy CA is not trusted by the device the request fails
// and the balance renders its "no signal" branch rather than a figure — which
// is the same path a driver on a bad stretch of highway takes, so it is a real
// state and not a proxy special case. No code change — trust the CA at OS level.

import { useCallback, useRef } from 'react'
import { View, ScrollView } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { MMKV } from 'react-native-mmkv'
import Animated from 'react-native-reanimated'
import { useViagemAtiva } from '../../hooks/useViagemAtiva'
import { useAcerto } from '../../hooks/useAcerto'
import { Text } from '../../components/ui/Text'
import { Button } from '../../components/ui/Button'
import { Surface } from '../../components/ui/Surface'
import { Chip } from '../../components/ui/Chip'
import { DataRow } from '../../components/ui/DataRow'
import { StatRow } from '../../components/ui/StatRow'
import { SyncStatus } from '../../components/ui/SyncStatus'
import { TopAppBar } from '../../components/ui/TopAppBar'
import { kmTotalViagem } from '../../lib/viagem/calcularViagem'
import { formatKm, formatReais } from '../../lib/utils/format'
import { shape, space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'
import { appear, settleLayout } from '../../lib/theme/motion'

const storage = new MMKV({ id: 'app_prefs' })

export default function HomeScreen() {
  const router = useRouter()
  const styles = useStyles()
  const { isViagemAtiva, viagemAtiva, tripRoute, pendenteSincronizacao } = useViagemAtiva()
  const {
    pendingBalance,
    loading: acertoLoading,
    error: acertoError,
    refresh: refreshAcerto,
  } = useAcerto()
  const frotaNome = storage.getString('frota_nome')

  // The open trip's own figures, read straight from the store. They are here
  // rather than only on the trip screen because this card used to be a chip, a
  // route and a button — and the driver's second question, after "is a trip
  // open", is how far he has got with it. Nothing is fetched for this.
  const trechosFechados = viagemAtiva?.trechos.filter((t) => t.fechadoEm != null).length ?? 0
  const kmRodado = viagemAtiva ? kmTotalViagem(viagemAtiva.trechos) : 0
  const gastoViagem = viagemAtiva
    ? viagemAtiva.abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0) +
      viagemAtiva.despesas.reduce((acc, d) => acc + d.valor, 0)
    : 0

  // Refetch the pending balance whenever the home screen regains focus, so it
  // reflects a payment confirmed on the web dashboard or a newly started trip
  // without an app restart. Skip the first focus — the hook fetches on mount.
  const hasFocusedRef = useRef(false)
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) refreshAcerto()
      hasFocusedRef.current = true
    }, [refreshAcerto]),
  )

  return (
    <View style={styles.screen}>
      <TopAppBar title="FreteAgro" subtitle={frotaNome ?? 'Painel do motorista'} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SyncStatus />

        {/* ── The open trip: the only block on this screen with an action ── */}
        <Surface level={1} padding="lg" reveal={0} style={styles.block}>
          {isViagemAtiva ? (
            <>
              <Chip label="Viagem em andamento" tone="live" icon="navigate" />
              <Text role="headlineSmall" numberOfLines={2} style={styles.route}>
                {tripRoute ?? 'Viagem em andamento'}
              </Text>

              <StatRow
                divided
                items={[
                  { label: 'Rodado até agora', value: formatKm(kmRodado) },
                  { label: 'Gasto na viagem', value: formatReais(gastoViagem) },
                ]}
              />

              <Text role="bodySmall" tone="faint">
                {trechosFechados === 0
                  ? 'Primeiro trecho ainda aberto.'
                  : `${trechosFechados} ${trechosFechados === 1 ? 'trecho concluído' : 'trechos concluídos'}.`}
              </Text>

              {pendenteSincronizacao && (
                <Text role="bodyMedium" tone="waiting">
                  Há registros guardados no aparelho, aguardando sinal.
                </Text>
              )}
              <Button
                label="Continuar viagem"
                icon="arrow-forward"
                onPress={() => router.push('/(app)/viagem/em-curso')}
                prominent
                style={styles.action}
              />
            </>
          ) : (
            <>
              <Chip label="Nenhuma viagem aberta" tone="neutral" icon="pause" />
              <Text role="headlineSmall" style={styles.route}>
                Pronto para sair
              </Text>
              <Text role="bodyMedium" tone="variant">
                Abra a viagem antes de pegar a estrada — é o km de saída que garante
                o seu acerto no final.
              </Text>
              <Button
                label="Iniciar viagem"
                icon="play"
                onPress={() => router.push('/(app)/viagem/iniciar')}
                prominent
                style={styles.action}
              />
            </>
          )}
        </Surface>

        {/* ── What he is owed: the screen's hero figure ── */}
        <Surface level={1} padding="lg" reveal={1} style={styles.block}>
          <Text role="titleMedium" tone="variant">
            A receber
          </Text>

          {acertoLoading ? (
            <View style={styles.placeholder} accessibilityLabel="Carregando seu saldo" />
          ) : acertoError != null ? (
            // Without this branch the card sat on a bare "—" forever whenever
            // the fetch failed, which on this product is routine: the driver
            // is usually out of signal. A dash is not a state — it reads as a
            // balance of nothing, which is the one thing it must never imply.
            <>
              <Text role="bodyMedium" tone="waiting">
                Não deu para buscar seu saldo agora. Isso costuma ser falta de sinal.
              </Text>
              <Button
                label="Tentar novamente"
                icon="refresh"
                variant="text"
                onPress={refreshAcerto}
                style={styles.retry}
              />
            </>
          ) : (
            // Keyed on the value so the figure cross-fades when a refresh lands
            // on a different number — a balance that changed silently under a
            // driver's eyes is the exact thing this product exists to prevent.
            <Animated.View
              key={pendingBalance.saldoFinal}
              entering={appear}
              layout={settleLayout}
            >
              <Text role="figureDisplay" tone="strong">
                {formatReais(pendingBalance.saldoFinal)}
              </Text>

              <View style={styles.breakdown}>
                <DataRow
                  label="Comissão bruta"
                  value={formatReais(pendingBalance.valorComissao)}
                />
                <DataRow
                  label="Deduções"
                  value={`− ${formatReais(pendingBalance.totalDeducoes)}`}
                />
              </View>

              <Text role="bodySmall" tone="faint" style={styles.note}>
                Estimativa das viagens ainda não acertadas. O valor final é o que o
                dono da frota confirmar no painel.
              </Text>
            </Animated.View>
          )}
        </Surface>
      </ScrollView>
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
    paddingBottom: space.xl,
    gap: space.base,
  },
  block: {
    gap: space.md,
  },
  route: {
    marginTop: space.xs,
  },
  action: {
    marginTop: space.sm,
  },
  breakdown: {
    gap: space.sm,
    marginTop: space.md,
  },
  note: {
    marginTop: space.md,
  },
  retry: {
    alignSelf: 'flex-start',
  },
  placeholder: {
    height: 56,
    width: '55%',
    borderRadius: shape.small,
    backgroundColor: colors.surfaceContainerHigh,
  },
}))
