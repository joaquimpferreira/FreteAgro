// components/ui/TopAppBar.tsx
// Screen context, and the back affordance.
//
// The bar sits on the page background rather than on a surface of its own and
// carries no divider. On a white ground a ruled header band would cut the
// screen in two for no gain — the title's size already says what it is, and
// the cards below it already separate themselves with their own shadow.
//
// The back control is a labeled target rather than a bare chevron on screens
// reached by a push — a driver who does not read icon conventions still gets
// the system Back gesture and button, which expo-router honors, but the on-
// screen control says "Voltar" out loud.

import { View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './Text'
import { space, touch } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'

export interface TopAppBarProps {
  title: string
  /** Second line under the title: fleet name, plate, date. */
  subtitle?: string
  onBack?: () => void
  /** Rendered at the trailing edge. Keep to one control. */
  trailing?: React.ReactNode
}

export function TopAppBar({ title, subtitle, onBack, trailing }: TopAppBarProps) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = useStyles()

  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
      {onBack != null && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          android_ripple={{ color: colors.onSurfaceVariant, borderless: true, radius: 24 }}
          style={styles.back}
          hitSlop={space.sm}
        >
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} accessible={false} />
        </Pressable>
      )}

      <View style={styles.titles}>
        <Text role="titleLarge" numberOfLines={1}>
          {title}
        </Text>
        {subtitle != null && (
          <Text role="bodyMedium" tone="variant" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {trailing}
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
    paddingHorizontal: space.base,
    paddingBottom: space.md,
    backgroundColor: colors.surface,
  },
  back: {
    width: touch.min,
    height: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -space.md,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
}))
