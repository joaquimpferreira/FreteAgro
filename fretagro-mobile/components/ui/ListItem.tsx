// components/ui/ListItem.tsx
// A tappable row carrying a headline, supporting text, an optional trailing
// figure and an optional state chip.
//
// One row shape serves the trip history, the settlement history and the
// queued-records list. They were three different rows before; a driver who
// learns to read one of them has now learned all three.
//
// The row is built as two nested views rather than one, and the reason is
// Android: the outer view casts the shadow that makes the row read as a card,
// and the inner one clips the ripple to the rounded corners. Clipping on the
// outer view — the obvious single-view version — clips the shadow away with it.

import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Text } from './Text'
import { Chip } from './Chip'
import { shape, space, touch } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { PRESS_SCALE, settle } from '../../lib/theme/motion'

type IoniconName = keyof typeof Ionicons.glyphMap

export interface ListItemProps {
  headline: string
  supporting?: string
  /** Right-set figure — money or distance. Tabular, so rows line up. */
  figure?: string
  chip?: { label: string; tone?: 'neutral' | 'done' | 'waiting' | 'error' | 'live' }
  leadingIcon?: IoniconName
  onPress?: () => void
}

export function ListItem({
  headline,
  supporting,
  figure,
  chip,
  leadingIcon,
  onPress,
}: ListItemProps) {
  const { colors, elevation } = useTheme()
  const styles = useStyles()

  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const content = (
    <View style={styles.row}>
      {leadingIcon != null && (
        <View style={styles.leading}>
          <Ionicons name={leadingIcon} size={22} color={colors.onSurfaceVariant} accessible={false} />
        </View>
      )}

      <View style={styles.body}>
        <Text role="titleMedium" numberOfLines={2}>
          {headline}
        </Text>
        {supporting != null && (
          <Text role="bodyMedium" tone="variant" numberOfLines={1}>
            {supporting}
          </Text>
        )}
        {chip != null && <Chip label={chip.label} tone={chip.tone} style={styles.chip} />}
      </View>

      <View style={styles.trailing}>
        {figure != null && (
          <Text role="figureSmall" numberOfLines={1}>
            {figure}
          </Text>
        )}
        {onPress != null && (
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} accessible={false} />
        )}
      </View>
    </View>
  )

  if (onPress == null) {
    return <View style={[styles.card, elevation[1]]}>{content}</View>
  }

  return (
    <Animated.View style={[styles.card, elevation[1], animated]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(PRESS_SCALE, settle)
        }}
        onPressOut={() => {
          scale.value = withSpring(1, settle)
        }}
        accessibilityRole="button"
        accessibilityLabel={[headline, supporting, figure, chip?.label].filter(Boolean).join('. ')}
        android_ripple={{ color: colors.onSurfaceVariant }}
        style={styles.clip}
      >
        {content}
      </Pressable>
    </Animated.View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    borderRadius: shape.medium,
  },
  clip: {
    borderRadius: shape.medium,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
    minHeight: touch.min + space.base,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
  },
  leading: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  body: {
    flex: 1,
    gap: space.xs,
  },
  chip: {
    marginTop: space.xs,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
}))
