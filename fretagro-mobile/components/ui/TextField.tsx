// components/ui/TextField.tsx
// Outlined text field, with the label pinned above the box rather than
// floating into it.
//
// The floating label is the one M3 affordance this app declines. It is a
// learned convention: the label sits inside the field until you focus, then
// animates up. PRODUCT.md records a driver whose phone experience is WhatsApp,
// and a label that moves when touched reads as the app doing something
// unexpected. The label stays put and always visible; the field is taller than
// the M3 default to match.
//
// What does animate is the outline, which thickens and turns green on focus.
// That is the opposite kind of motion: nothing moves position, so nothing has
// to be re-found — the field the keyboard is pointed at just becomes the
// obvious one. It matters more than usual here, where the driver is filling in
// an odometer reading with the sun washing out every hue on the screen.
//
// Errors name the problem and the recovery, and they are announced, not just
// colored — the field keeps its written message under it at all times.

import { useEffect } from 'react'
import { View, TextInput, TextInputProps } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Text } from './Text'
import { shape, space, touch, type as typeScale } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { appear, disappear, easeStandard } from '../../lib/theme/motion'

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string
  /** Shown under the field when there is no error. Use it to explain the format. */
  hint?: string
  error?: string
  /** Unit rendered inside the field's trailing edge: "km", "L", "R$". */
  suffix?: string
}

export function TextField({ label, hint, error, suffix, ...props }: TextFieldProps) {
  const { colors } = useTheme()
  const styles = useStyles()

  const hasError = error != null
  // 0 resting, 1 focused. An errored field is pinned at 1 so its outline stays
  // at full weight whether or not the driver is currently in it.
  const focus = useSharedValue(hasError ? 1 : 0)

  useEffect(() => {
    if (hasError) focus.value = withTiming(1, easeStandard)
  }, [hasError, focus])

  const outline = useAnimatedStyle(() => ({
    borderWidth: interpolate(focus.value, [0, 1], [1, 2]),
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [colors.outline, hasError ? colors.error : colors.primary],
    ),
  }))

  return (
    <View style={styles.group}>
      <Text role="labelLarge" tone="variant">
        {label}
      </Text>

      <Animated.View style={[styles.box, outline]}>
        <TextInput
          {...props}
          onFocus={(e) => {
            focus.value = withTiming(1, easeStandard)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            if (!hasError) focus.value = withTiming(0, easeStandard)
            props.onBlur?.(e)
          }}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.onSurfaceFaint}
          cursorColor={colors.primary}
          selectionColor={colors.primary}
          style={styles.input}
        />
        {suffix != null && (
          <Text role="titleMedium" tone="variant" style={styles.suffix}>
            {suffix}
          </Text>
        )}
      </Animated.View>

      {(error ?? hint) != null && (
        <Animated.View entering={appear} exiting={disappear}>
          <Text role="bodySmall" tone={hasError ? 'error' : 'faint'}>
            {error ?? hint}
          </Text>
        </Animated.View>
      )}
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  group: {
    gap: space.sm,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.actionHeight,
    borderRadius: shape.small,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: space.base,
  },
  input: {
    flex: 1,
    // bodyLarge is the floor for an input: 16sp is the smallest size that stays
    // readable outdoors, and anything smaller also makes Android zoom on focus.
    ...typeScale.bodyLarge,
    color: colors.onSurface,
    paddingVertical: space.md,
  },
  suffix: {
    marginLeft: space.sm,
  },
}))
