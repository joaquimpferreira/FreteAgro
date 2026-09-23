// components/ui/Skeleton.tsx
// Loading placeholders shaped like the content that replaces them.
//
// This app loads lists over a rural mobile connection, where "loading" is
// routine and often slow. A spinner centred in an empty screen tells the
// driver nothing about what is coming and makes an eight-second wait feel
// broken; a list-shaped placeholder tells him rows are on the way and keeps
// the layout from jumping when they land.
//
// These used to be deliberately static, on the grounds that a shimmer would
// burn frames on an entry-level Android for the whole duration of a slow
// request. The concern was right and the conclusion was not: a static gray
// block is indistinguishable from content that failed to render, which on a
// connection this bad is a real thing the driver sees. So there is a pulse —
// but it is one opacity value per list, driven on the UI thread, shared by
// every bar in that list. It costs one interpolation per frame and it cannot
// be starved by the request it is waiting on.

import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type AnimatedStyle,
  Easing,
} from 'react-native-reanimated'
import type { ViewStyle } from 'react-native'
import { Surface } from './Surface'
import { shape, space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'

/** One shared opacity for every bar in one placeholder. */
function usePulse(): AnimatedStyle<ViewStyle> {
  const value = useSharedValue(0.45)

  useEffect(() => {
    value.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [value])

  return useAnimatedStyle(() => ({ opacity: value.value }))
}

export interface SkeletonListProps {
  /** How many placeholder rows to draw. */
  rows?: number
}

/** Placeholder for a list of ListItem rows. */
export function SkeletonList({ rows = 4 }: SkeletonListProps) {
  const styles = useStyles()
  const pulse = usePulse()

  return (
    <View style={styles.list} accessibilityRole="progressbar" accessibilityLabel="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <Surface key={i} level={1} radius="medium" padding="base" style={styles.row}>
          <Animated.View style={[styles.avatar, pulse]} />
          <View style={styles.lines}>
            <Animated.View style={[styles.line, styles.lineWide, pulse]} />
            <Animated.View style={[styles.line, styles.lineNarrow, pulse]} />
          </View>
        </Surface>
      ))}
    </View>
  )
}

/** Placeholder for a figure-led card (a balance, a total). */
export function SkeletonCard() {
  const styles = useStyles()
  const pulse = usePulse()

  return (
    <Surface
      level={1}
      padding="lg"
      style={styles.card}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      <Animated.View style={[styles.line, styles.lineLabel, pulse]} />
      <Animated.View style={[styles.line, styles.lineFigure, pulse]} />
      <Animated.View style={[styles.line, styles.lineWide, pulse]} />
    </Surface>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  list: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  lines: {
    flex: 1,
    gap: space.sm,
  },
  line: {
    height: 12,
    borderRadius: shape.extraSmall,
    backgroundColor: colors.surfaceContainerHigh,
  },
  lineWide: {
    width: '78%',
  },
  lineNarrow: {
    width: '45%',
  },
  lineLabel: {
    width: '32%',
  },
  lineFigure: {
    width: '55%',
    height: 32,
    borderRadius: shape.small,
  },
  card: {
    gap: space.md,
  },
}))
