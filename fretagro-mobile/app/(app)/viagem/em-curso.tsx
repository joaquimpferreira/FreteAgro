// app/(app)/viagem/em-curso.tsx
// The open trip: the leg in progress, what has been spent, and the four things
// the driver can do next.
//
// Reading order is the order of urgency at a pump: which leg is open and how to
// close it, then the two expense actions he stopped to perform, then the legs
// already closed as a record he can check but not change.
//
// "Avançar trecho" is docked at the bottom edge rather than sitting inside the
// leg card. It is the action this screen exists for and it happens many times
// per trip, so it belongs where a thumb already rests and where a long list of
// closed legs cannot push it off the screen. "Encerrar viagem" is deliberately
// at the far end of the content: it happens once, it makes the trip immutable,
// and reaching it should cost a scroll.
//
// The expense total is broken into its two lines rather than shown as one
// figure. The driver is being asked to trust a number that will be deducted
// from his pay; the arithmetic behind it is already on this screen's data, so
// withholding it bought nothing.
//
// Layer: app — imports from store/ and components/ only.

import { View, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useViagemStore } from '../../../store/viagemStore'
import { TrechoAtual } from '../../../components/viagem/TrechoAtual'
import { TrechoCard } from '../../../components/viagem/TrechoCard'
import { Text } from '../../../components/ui/Text'
import { Button } from '../../../components/ui/Button'
import { Surface } from '../../../components/ui/Surface'
import { SyncStatus } from '../../../components/ui/SyncStatus'
import { TopAppBar } from '../../../components/ui/TopAppBar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ScreenActions } from '../../../components/ui/ScreenActions'
import { DataRow } from '../../../components/ui/DataRow'
import { formatReais } from '../../../lib/utils/format'
import { space } from '../../../lib/theme'
import { makeStyles } from '../../../lib/theme/ThemeProvider'

export default function EmCurso() {
  const styles = useStyles()
  const viagem = useViagemStore((s) => s.viagem)

  if (!viagem) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Viagem" onBack={() => router.back()} />
        <EmptyState
          icon="car-outline"
          title="Nenhuma viagem aberta"
          description="Abra uma viagem para começar a registrar trechos, abastecimentos e despesas."
          action={{
            label: 'Iniciar viagem',
            icon: 'play',
            onPress: () => router.replace('/(app)/viagem/iniciar'),
          }}
        />
      </View>
    )
  }

  const trechoAtual = viagem.trechos[viagem.trechoAtualIndex]
  const trechosFechados = viagem.trechos.filter((t) => t.fechadoEm != null)

  const totalAbastecimentos = viagem.abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0)
  const totalDespesas = viagem.despesas.reduce((acc, d) => acc + d.valor, 0)
  const totalGeral = totalAbastecimentos + totalDespesas
  const lancamentos = viagem.abastecimentos.length + viagem.despesas.length

  const rota =
    viagem.origem && viagem.destino ? `${viagem.origem} → ${viagem.destino}` : 'Viagem em andamento'

  return (
    <View style={styles.screen}>
      <TopAppBar title={rota} subtitle="Viagem em andamento" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SyncStatus />

        {trechoAtual && (
          <TrechoAtual
            trecho={trechoAtual}
            numero={viagem.trechoAtualIndex + 1}
            abastecimentos={viagem.abastecimentos}
          />
        )}

        {/* ── What he stopped to do ── */}
        <View style={styles.expenseActions}>
          <Button
            label="Abastecer"
            icon="water"
            variant="tonal"
            onPress={() => router.push('/(app)/despesas/abastecimento')}
            style={styles.expenseAction}
          />
          <Button
            label="Despesa"
            icon="receipt"
            variant="tonal"
            onPress={() => router.push('/(app)/despesas/geral')}
            style={styles.expenseAction}
          />
        </View>

        {/* ── Running total, with the two lines that make it ── */}
        <Surface level={1} padding="lg" style={styles.totals}>
          <Text role="titleMedium">Gasto nesta viagem</Text>

          {lancamentos === 0 ? (
            <Text role="bodyMedium" tone="variant">
              Nenhum lançamento ainda. O que você gastar na estrada entra aqui.
            </Text>
          ) : (
            <View style={styles.rows}>
              <DataRow label="Abastecimentos" value={formatReais(totalAbastecimentos)} />
              <DataRow label="Outras despesas" value={formatReais(totalDespesas)} />
              <DataRow
                label="Total"
                value={formatReais(totalGeral)}
                emphasis="negative"
                divided
              />
            </View>
          )}
        </Surface>

        {/* ── Closed legs: a record, not an action ── */}
        {trechosFechados.length > 0 && (
          <View style={styles.history}>
            <Text role="titleMedium" tone="variant">
              {trechosFechados.length}{' '}
              {trechosFechados.length === 1 ? 'trecho concluído' : 'trechos concluídos'}
            </Text>
            {trechosFechados.map((t, idx) => (
              <TrechoCard
                key={t.id}
                trecho={t}
                abastecimentos={viagem.abastecimentos}
                numero={idx + 1}
              />
            ))}
          </View>
        )}

        <Button
          label="Encerrar viagem"
          icon="flag"
          variant="outlined"
          destructive
          onPress={() => router.push('/(app)/viagem/encerrar')}
          style={styles.encerrar}
        />
      </ScrollView>

      <ScreenActions>
        <Button
          label="Avançar trecho"
          icon="arrow-forward"
          onPress={() => router.push('/(app)/viagem/avancar-trecho')}
          prominent
        />
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
  expenseActions: {
    flexDirection: 'row',
    gap: space.md,
  },
  expenseAction: {
    flex: 1,
  },
  totals: {
    gap: space.md,
  },
  rows: {
    gap: space.sm,
  },
  history: {
    gap: space.md,
    marginTop: space.sm,
  },
  encerrar: {
    marginTop: space.sm,
  },
}))
