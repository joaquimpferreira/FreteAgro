// components/ui/ChoiceChips.tsx
// M3 filter chips as a single-select group that wraps.
//
// For choices with more options than a segmented control can hold — cargo
// type, expense type. Selected chips carry a check mark as well as a fill,
// because a fill's hue is the first thing to wash out in direct sun. The chip
// widens to make room for the mark, and its siblings slide rather than jump —
// otherwise picking "Pedágio" moves "Oficina" out from under the thumb that is
// already on its way to it.

import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated'
import { Text } from './Text'
import { shape, space, touch, duration } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { settleLayout } from '../../lib/theme/motion'

export interface Choice<T extends string> {
  value: T
  label: string
}

export interface ChoiceChipsProps<T extends string> {
  label: string
  choices: readonly Choice<T>[]
  value: T
  onChange: (value: T) => void
}

export function ChoiceChips<T extends string>({
  label,
  choices,
  value,
  onChange,
}: ChoiceChipsProps<T>) {
  const { colors } = useTheme()
  const styles = useStyles()

  return (
    <View style={styles.group}>
      <Text role="labelLarge" tone="variant">
        {label}
      </Text>
      <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {choices.map((choice) => {
          const selected = choice.value === value
          return (
            <Animated.View key={choice.value} layout={settleLayout}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {})
                  onChange(choice.value)
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={choice.label}
                android_ripple={{ color: colors.primary }}
                style={[styles.chip, selected && styles.chipSelected]}
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
                <Text role="labelLarge" tone={selected ? 'onPrimaryContainer' : 'variant'}>
                  {choice.label}
                </Text>
              </Pressable>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  group: {
    gap: space.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touch.min,
    paddingHorizontal: space.base,
    borderRadius: shape.full,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  chipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
}))
