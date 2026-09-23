// components/ui/Button.tsx
// M3 button, in the four variants the app actually uses.
//
//   filled    the one primary action on a screen — never two on the same screen
//   tonal     a secondary action of real weight (Abastecer, Lançar despesa)
//   outlined  a reversible alternative (Cancelar)
//   text      a low-stakes inline action
//
// Every variant ships default, pressed, disabled and loading. Android ripple
// is left to the platform rather than reimplemented with opacity, because a
// fluent Android user reads its absence as a broken control.
//
// The press also scales the control down a hair on a spring. That is not
// decoration: on this hardware the ripple can take a frame or two to appear,
// and the driver — gloved, in sun, not looking closely — needs the control to
// answer his thumb immediately. The scale is on the UI thread, so it answers
// even while the JS thread is busy committing the record he just tapped.
//
// `label` is required and never optional: PRODUCT.md records that this app's
// driver has low smartphone familiarity, so an icon-only button is not
// available vocabulary here. The icon may only ever accompany a written label.

import { Pressable, ActivityIndicator, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Text } from './Text'
import { shape, space, touch, type ColorRoles } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { PRESS_SCALE, settle } from '../../lib/theme/motion'

type Variant = 'filled' | 'tonal' | 'outlined' | 'text'
type IoniconName = keyof typeof Ionicons.glyphMap

export interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  /** Optional leading icon. Decorative — the label carries the meaning. */
  icon?: IoniconName
  disabled?: boolean
  loading?: boolean
  /** Destructive actions take the error roles regardless of variant. */
  destructive?: boolean
  /** 56dp instead of 48dp, for the single primary action on a screen. */
  prominent?: boolean
  /** Layout only — margins, alignment. The control owns its own fill and shape. */
  style?: ViewStyle
}

interface VariantColors {
  background: string
  content: string
  border?: string
  ripple: string
}

function resolveColors(
  variant: Variant,
  destructive: boolean,
  colors: ColorRoles,
): VariantColors {
  if (destructive) {
    switch (variant) {
      case 'filled':
        return { background: colors.errorContainer, content: colors.onErrorContainer, ripple: colors.error }
      case 'tonal':
        return { background: colors.surfaceContainerHigh, content: colors.error, ripple: colors.error }
      case 'outlined':
        return { background: 'transparent', content: colors.error, border: colors.error, ripple: colors.error }
      default:
        return { background: 'transparent', content: colors.error, ripple: colors.error }
    }
  }
  switch (variant) {
    case 'filled':
      return { background: colors.primaryFill, content: colors.onPrimaryFill, ripple: colors.onPrimaryFill }
    case 'tonal':
      return { background: colors.primaryContainer, content: colors.onPrimaryContainer, ripple: colors.primary }
    case 'outlined':
      return { background: 'transparent', content: colors.onSurface, border: colors.outline, ripple: colors.primary }
    default:
      return { background: 'transparent', content: colors.primary, ripple: colors.primary }
  }
}

export function Button({
  label,
  onPress,
  variant = 'filled',
  icon,
  disabled = false,
  loading = false,
  destructive = false,
  prominent = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme()
  const styles = useStyles()
  const inactive = disabled || loading
  const c = resolveColors(variant, destructive, colors)

  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  function handlePress() {
    // A committed record is a physical event; the driver is often not looking
    // at the screen when his thumb lands.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    onPress()
  }

  return (
    <Animated.View style={[animated, inactive && styles.inactive, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(PRESS_SCALE, settle)
        }}
        onPressOut={() => {
          scale.value = withSpring(1, settle)
        }}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        android_ripple={inactive ? undefined : { color: c.ripple, borderless: false }}
        style={[
          styles.base,
          {
            minHeight: prominent ? touch.actionHeight : touch.min,
            backgroundColor: c.background,
          },
          c.border != null && { borderWidth: 1, borderColor: c.border },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={c.content} />
        ) : (
          <View style={styles.row}>
            {icon != null && (
              <Ionicons name={icon} size={20} color={c.content} accessible={false} />
            )}
            <Text
              role="labelLarge"
              numberOfLines={1}
              style={[styles.label, { color: c.content }]}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

const useStyles = makeStyles(() => ({
  base: {
    borderRadius: shape.full,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  label: {
    textAlign: 'center',
  },
  inactive: {
    // M3 disabled: 12% container, 38% content. Opacity on the whole control is
    // the honest approximation in RN and keeps the label legible at 38%.
    opacity: 0.38,
  },
}))
