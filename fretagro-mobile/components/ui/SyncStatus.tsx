// components/ui/SyncStatus.tsx
// The app's connectivity and queue state, as one calm line. Self-contained:
// drop `<SyncStatus />` into any screen and it reads the queue and owns its
// own detail sheet, with no props to thread through the navigator.
//
// This replaces a full-width error-red "Sem conexão" banner. Losing signal on
// a Mato Grosso highway is the normal operating condition, not a fault, and
// PRODUCT.md records that the app must say so: the offline-first queue means
// nothing is lost, so the honest message is how many records are safely held,
// not that something went wrong.
//
// Four states, each with its own written label, its own icon, and its own
// tone — never tone alone, because hue separation is the first thing to go on
// a cheap LCD in direct sun:
//
//   offline, nothing queued   "Sem sinal · nada pendente"   waiting
//   offline, N queued         "Sem sinal · N guardados"     waiting, tappable
//   online, N queued          "Enviando N itens"            waiting
//   online, nothing queued    nothing at all
//
// The last case renders nothing on purpose. A permanent "tudo certo" badge
// trains the driver to stop reading the row, which costs the other three
// states their only chance of being noticed.
//
// The row fades in and out, and the content below it closes the gap on the
// same curve. Signal comes and goes constantly on this route; a row that
// appeared and vanished by snapping would make the whole screen twitch every
// time the truck passed a hill.

import { useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import { Text } from './Text'
import { PendingSyncList } from './PendingSyncList'
import { shape, space, touch } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { appear, disappear } from '../../lib/theme/motion'
import { useConectividade } from '../../hooks/useConectividade'
import { useSyncStatus } from '../../hooks/useSync'

export interface SyncStatusProps {
  style?: ViewStyle
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

export function SyncStatus({ style }: SyncStatusProps) {
  const { isConnected } = useConectividade()
  const { pendingCount } = useSyncStatus()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { colors } = useTheme()
  const styles = useStyles()

  if (isConnected && pendingCount === 0) return null

  const label = !isConnected
    ? pendingCount > 0
      ? `Sem sinal · ${pendingCount} ${plural(pendingCount, 'item guardado', 'itens guardados')}`
      : 'Sem sinal · nada pendente'
    : `Enviando ${pendingCount} ${plural(pendingCount, 'item', 'itens')}`

  const icon = !isConnected ? 'cloud-offline-outline' : 'cloud-upload-outline'
  const canOpen = pendingCount > 0

  const body = (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.onTertiaryContainer} accessible={false} />
      <Text role="labelLarge" tone="onTertiaryContainer" style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {canOpen && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.onTertiaryContainer}
          accessible={false}
        />
      )}
    </View>
  )

  return (
    <>
      <Animated.View entering={appear} exiting={disappear}>
        {canOpen ? (
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${label}. Toque para ver os itens guardados.`}
            android_ripple={{ color: colors.tertiary }}
            style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
          >
            {body}
          </Pressable>
        ) : (
          <View
            accessibilityRole="text"
            accessibilityLabel={label}
            style={[styles.container, style]}
          >
            {body}
          </View>
        )}
      </Animated.View>

      <PendingSyncList visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  container: {
    minHeight: touch.min,
    justifyContent: 'center',
    backgroundColor: colors.tertiaryContainer,
    borderRadius: shape.medium,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
}))
