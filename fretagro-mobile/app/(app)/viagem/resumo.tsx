// app/(app)/viagem/resumo.tsx
// Trip Summary — read-only, shown once right after the trip closes.
//
// This is the receipt for what the driver just did, so it opens by confirming
// the trip is closed and saved before showing any figure. No edit actions:
// the trip is immutable from here.
//
// The confirmation card carries the trip's two headline figures — total km and
// total spend — instead of only a sentence. Both were already computed further
// down this screen; the driver just spent a week earning them, and making him
// scroll past a reassurance to reach them read as an app that had nothing to
// say. It costs no new interaction: every figure is one he entered himself.
//
// "Ir para início" is docked at the bottom edge, because this screen is pure
// reading and its only job at the end is to let him leave. "Ver minhas viagens"
// stays in the content — the Viagens destination is one tap away in the
// navigation bar, so it does not need a second reserved slot.
//
// Layer: app — imports from store/ and components/ only.

import { View, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useViagemStore } from '../../../store/viagemStore'
import { ViagemResumo } from '../../../components/viagem/ViagemResumo'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { Surface } from '../../../components/ui/Surface'
import { StatRow } from '../../../components/ui/StatRow'
import { SyncStatus } from '../../../components/ui/SyncStatus'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ScreenActions } from '../../../components/ui/ScreenActions'
import { Ionicons } from '@expo/vector-icons'
import { kmTotalViagem } from '../../../lib/viagem/calcularViagem'
import { formatKm, formatReais } from '../../../lib/utils/format'
import { shape, space } from '../../../lib/theme'
import { makeStyles, useTheme } from '../../../lib/theme/ThemeProvider'

export default function ViagemResumoScreen() {
  const { colors } = useTheme()
  const styles = useStyles()
  const viagem = useViagemStore((s) => s.viagemEncerrada)
  const limparViagemEncerrada = useViagemStore((s) => s.limparViagemEncerrada)

  function handleGoHome() {
    limparViagemEncerrada()
    router.replace('/(app)/')
  }

  function handleGoHistorico() {
    limparViagemEncerrada()
    router.replace('/(app)/historico')
  }

  if (!viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Resumo da viagem" />
        <EmptyState
          icon="document-text-outline"
          title="Nada para mostrar aqui"
          description="Esta tela aparece logo depois que você encerra uma viagem. As viagens antigas ficam em Viagens."
          action={{ label: 'Ir para início', icon: 'home', onPress: handleGoHome }}
        />
      </View>
    )
  }

  const rota =
    viagem.origem && viagem.destino ? `${viagem.origem} → ${viagem.destino}` : 'Viagem encerrada'

  const kmRodado = kmTotalViagem(viagem.trechos)
  const totalGasto =
    viagem.abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0) +
    viagem.despesas.reduce((acc, d) => acc + d.valor, 0)

  return (
    <View style={styles.screen}>
      <TopAppBar title="Viagem encerrada" subtitle={rota} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* The confirmation comes before the figures: the driver's first
            question after tapping "Encerrar" is whether it went through. The
            figures follow in the same card, so the receipt reads as one thing. */}
        <Surface level={1} padding="lg" style={styles.confirmation}>
          <View style={styles.confirmationHeader}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={28} color={colors.onPrimaryFill} accessible={false} />
            </View>
            <View style={styles.confirmationText}>
              <Text role="titleLarge">Viagem encerrada</Text>
              <Text role="bodyMedium" tone="variant">
                Está tudo guardado no aparelho. Assim que houver sinal, vai sozinho para o
                painel do dono da frota.
              </Text>
            </View>
          </View>

          <StatRow
            divided
            items={[
              { label: 'Você rodou', value: formatKm(kmRodado), emphasis: true },
              { label: 'Você gastou', value: formatReais(totalGasto) },
            ]}
          />
        </Surface>

        <SyncStatus />

        <ViagemResumo
          trechos={viagem.trechos}
          abastecimentos={viagem.abastecimentos}
          despesas={viagem.despesas}
        />

        <Button
          label="Ver minhas viagens"
          icon="time"
          variant="text"
          onPress={handleGoHistorico}
          style={styles.secondary}
        />
      </ScrollView>

      <ScreenActions>
        <Button label="Ir para início" icon="home" onPress={handleGoHome} prominent />
      </ScreenActions>
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
    paddingBottom: space.base,
    gap: space.base,
  },
  confirmation: {
    gap: space.md,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.base,
  },
  check: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
    backgroundColor: colors.primaryFill,
  },
  confirmationText: {
    flex: 1,
    gap: space.xs,
  },
  secondary: {
    marginTop: space.sm,
  },
}))
