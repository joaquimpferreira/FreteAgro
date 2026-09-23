// components/ui/PendingSyncList.tsx
// Bottom sheet listing the records held locally until signal returns (FR-028).
// Read-only — it never dequeues or edits.
//
// The point of this sheet is reassurance, not diagnostics: a driver who just
// logged a R$ 1.200 fuel stop with no bars wants to see that the fuel stop is
// in there. So each row names the record in his words ("Abastecimento"), says
// when he made it, and the sheet's header states plainly that nothing is lost.

import { View, FlatList, Modal, Pressable, StyleSheet } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './Text'
import { shape, space, touch } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { peek, type OperacaoPendente, type OperacaoTipo } from '../../lib/storage/queueStorage'

const TIPO_LABELS: Record<OperacaoTipo, string> = {
  CREATE_VIAGEM: 'Início de viagem',
  CREATE_TRECHO: 'Novo trecho',
  CREATE_ABASTECIMENTO: 'Abastecimento',
  CREATE_LANCAMENTO: 'Despesa',
  CLOSE_TRECHO: 'Trecho fechado',
  CLOSE_VIAGEM: 'Viagem encerrada',
}

const TIPO_ICONS: Record<OperacaoTipo, keyof typeof Ionicons.glyphMap> = {
  CREATE_VIAGEM: 'play-outline',
  CREATE_TRECHO: 'git-branch-outline',
  CREATE_ABASTECIMENTO: 'water-outline',
  CREATE_LANCAMENTO: 'receipt-outline',
  CLOSE_TRECHO: 'checkmark-done-outline',
  CLOSE_VIAGEM: 'flag-outline',
}

interface PendingSyncListProps {
  visible: boolean
  onClose: () => void
}

function PendingRow({ item }: { item: OperacaoPendente }) {
  const { colors } = useTheme()
  const styles = useStyles()
  const label = TIPO_LABELS[item.tipo] ?? item.tipo
  const relativeTime = formatDistanceToNow(new Date(item.updatedAt), {
    addSuffix: true,
    locale: ptBR,
  })
  const supporting =
    item.tentativas > 0
      ? `${relativeTime} · ${item.tentativas} ${item.tentativas > 1 ? 'tentativas' : 'tentativa'} de envio`
      : relativeTime

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={TIPO_ICONS[item.tipo] ?? 'ellipse-outline'}
          size={20}
          color={colors.onSurfaceVariant}
          accessible={false}
        />
      </View>
      <View style={styles.rowBody}>
        <Text role="titleMedium">{label}</Text>
        <Text role="bodySmall" tone="variant">
          {supporting}
        </Text>
      </View>
    </View>
  )
}

export function PendingSyncList({ visible, onClose }: PendingSyncListProps) {
  const { colors } = useTheme()
  const styles = useStyles()
  // peek() is a synchronous MMKV read — safe to call inside render.
  const ops = peek()

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Fechar" />

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text role="titleLarge">Guardado no aparelho</Text>
            <Text role="bodyMedium" tone="variant">
              {ops.length === 0
                ? 'Nada aguardando envio.'
                : `${ops.length} ${ops.length === 1 ? 'registro vai' : 'registros vão'} para o painel assim que houver sinal. Nada se perde.`}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            android_ripple={{ color: colors.onSurfaceVariant, borderless: true, radius: 24 }}
            style={styles.close}
          >
            <Ionicons name="close" size={24} color={colors.onSurfaceVariant} accessible={false} />
          </Pressable>
        </View>

        <FlatList
          data={ops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PendingRow item={item} />}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
        />
      </View>
    </Modal>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: colors.surfaceContainerLow,
    borderTopLeftRadius: shape.extraLarge,
    borderTopRightRadius: shape.extraLarge,
    paddingBottom: space.xxl,
  },
  grabber: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: shape.full,
    backgroundColor: colors.outlineVariant,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.base,
  },
  headerText: {
    flex: 1,
    gap: space.xs,
  },
  close: {
    width: touch.min,
    height: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -space.sm,
    marginRight: -space.md,
  },
  list: {
    paddingHorizontal: space.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
    paddingVertical: space.md,
    minHeight: touch.min,
  },
  rowIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
  },
}))
