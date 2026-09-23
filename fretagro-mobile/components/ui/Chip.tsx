// components/ui/Chip.tsx
// M3 chip, used here for state (sync, acerto status, leg type).
//
// Each tone carries a written label and, where it means anything, an icon.
// Color is never the only signal: the screen is read in direct sun on a cheap
// LCD, where hue separation is the first thing to go.
//
// `waiting` is deliberately not `error`. Losing signal on a Mato Grosso
// highway is the normal condition, and PRODUCT.md records that the app must
// present it as a calm fact rather than a failure the driver must resolve.

import { View, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './Text'
import { shape, space, type ColorRoles } from '../../lib/theme'
import { useTheme } from '../../lib/theme/ThemeProvider'

type Tone = 'neutral' | 'done' | 'waiting' | 'error' | 'live'
type IoniconName = keyof typeof Ionicons.glyphMap

export interface ChipProps {
  label: string
  tone?: Tone
  icon?: IoniconName
  style?: ViewStyle
}

function toneStyle(tone: Tone, colors: ColorRoles): { background: string; content: string } {
  switch (tone) {
    case 'done':
      return { background: colors.primaryContainer, content: colors.onPrimaryContainer }
    case 'waiting':
      return { background: colors.tertiaryContainer, content: colors.onTertiaryContainer }
    case 'error':
      return { background: colors.errorContainer, content: colors.onErrorContainer }
    case 'live':
      return { background: colors.primaryFill, content: colors.onPrimaryFill }
    default:
      return { background: colors.surfaceContainerHigh, content: colors.onSurfaceVariant }
  }
}

export function Chip({ label, tone = 'neutral', icon, style }: ChipProps) {
  const { colors } = useTheme()
  const t = toneStyle(tone, colors)

  return (
    <View style={[styles.chip, { backgroundColor: t.background }, style]}>
      {icon != null && <Ionicons name={icon} size={16} color={t.content} accessible={false} />}
      <Text role="labelMedium" numberOfLines={1} style={{ color: t.content }}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs + 2,
    paddingHorizontal: space.md,
    paddingVertical: space.sm - 1,
    borderRadius: shape.full,
  },
})
