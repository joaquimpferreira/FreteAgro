// components/ui/SegmentedButtons.tsx
// M3 segmented buttons — a small, fixed, mutually exclusive choice.
//
// Used for the choices this app makes the driver pick between at the pump:
// Diesel or Arla, vazio or carregado. Two to three options only; anything
// longer belongs in a list, not in a segment.
//
// The selected segment carries a check mark as well as a fill, so the choice
// survives a sunlit screen where the fill's hue has washed out. The check mark
// scales in rather than appearing, which is the only cue that arrives fast
// enough to be seen by a driver who has already looked away from the screen.

import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated'
import { Text } from './Text'
import { shape, space, touch, duration } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'

export interface Segment<T extends string> {
  value: T
  label: string
}

export interface SegmentedButtonsProps<T extends string> {
  segments: readonly Segment<T>[]
  value: T
  onChange: (value: T) => void
  /** Announced as the group's purpose, e.g. "Tipo de combustível". */
  label: string
}

export function SegmentedButtons<T extends string>({
  segments,
  value,
  onChange,
  label,
}: SegmentedButtonsProps<T>) {
  const { colors } = useTheme()
  const styles = useStyles()

  return (
    <View style={styles.field}>
      {/* The group label is rendered, not just announced: a driver who does not
          read app conventions cannot infer what a bare pair of pills is asking. */}
      <Text role="labelLarge" tone="variant">
        {label}
      </Text>
      <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {segments.map((segment, index) => {
          const selected = segment.value === value
          const isFirst = index === 0
          const isLast = index === segments.length - 1

          return (
            <Pressable
              key={segment.value}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
                onChange(segment.value)
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={segment.label}
              android_ripple={{ color: colors.primary }}
              style={[
                styles.segment,
                isFirst && styles.first,
                isLast && styles.last,
                !isLast && styles.divider,
                selected && styles.selected,
              ]}
            >
              {selected && (
                <Animated.View
                  entering={ZoomIn.duration(duration.short)}
                  exiting={ZoomOut.duration(duration.short)}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.onPrimaryContainer}
                    accessible={false}
                  />
                </Animated.View>
              )}
              <Text
                role="labelLarge"
                tone={selected ? 'onPrimaryContainer' : 'variant'}
                numberOfLines={1}
              >
                {segment.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  field: {
    gap: space.md,
  },
  group: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: shape.full,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: touch.min,
    paddingHorizontal: space.md,
  },
  first: {
    borderTopLeftRadius: shape.full,
    borderBottomLeftRadius: shape.full,
  },
  last: {
    borderTopRightRadius: shape.full,
    borderBottomRightRadius: shape.full,
  },
  divider: {
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  selected: {
    backgroundColor: colors.primaryContainer,
  },
}))
