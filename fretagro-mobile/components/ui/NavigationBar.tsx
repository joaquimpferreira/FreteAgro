// components/ui/NavigationBar.tsx
// The four driver destinations, as a bar that floats over the content.
//
// Two decisions, and they pull in opposite directions on purpose.
//
//   The bar floats: it is inset from the screen edges, fully rounded, and sits
//   on its own shadow above whatever is scrolling underneath. That is a product
//   shape rather than the platform's, and it is the one thing on this surface
//   that is allowed to be.
//
//   The labels do not: every destination carries its written label at all
//   times, active or not. The floating bars this borrows its shape from show
//   the label only on the selected tab and ask you to recognize three unlabeled
//   glyphs. PRODUCT.md records a driver whose phone experience is WhatsApp —
//   that is a convention he does not have, and the shape is not worth it.
//
// The active indicator travels between destinations instead of cutting. A cut
// makes the driver find the new selection; a 200ms slide hands it to him,
// because his eye follows the moving thing. It runs on the UI thread, so it
// stays smooth across the tab's first render even when that render is doing
// MMKV reads.

import { useEffect, useRef, useState } from 'react'
import { View, Pressable, LayoutChangeEvent } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Text } from './Text'
import { shape, space, touch } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { easeStandard, settle } from '../../lib/theme/motion'

type IoniconName = keyof typeof Ionicons.glyphMap

interface Destination {
  name: string
  label: string
  icon: IoniconName
  iconOutline: IoniconName
}

// Visible destinations only — push-only routes (viagem/*, despesas/*) are excluded.
const DESTINATIONS: readonly Destination[] = [
  { name: 'index', label: 'Início', icon: 'home', iconOutline: 'home-outline' },
  { name: 'historico', label: 'Viagens', icon: 'time', iconOutline: 'time-outline' },
  { name: 'acerto', label: 'Acerto', icon: 'cash', iconOutline: 'cash-outline' },
  { name: 'perfil', label: 'Perfil', icon: 'person', iconOutline: 'person-outline' },
]

/** Width of the pill behind the active icon. */
const INDICATOR_WIDTH = 60
/** Height of that pill. Half of it is the radius — see the note in `styles`. */
const INDICATOR_HEIGHT = 32

export function NavigationBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { colors, elevation } = useTheme()
  const styles = useStyles()

  const activeName = state.routes[state.index]?.name
  // −1 while a push-only route (viagem/*, despesas/*) is on top. The bar still
  // renders there, and no destination is the current one.
  const activeIndex = DESTINATIONS.findIndex((d) => d.name === activeName)

  const [rowWidth, setRowWidth] = useState(0)
  const slotWidth = rowWidth / DESTINATIONS.length

  const offset = useSharedValue(0)
  const presence = useSharedValue(activeIndex >= 0 ? 1 : 0)
  const placed = useRef(false)

  useEffect(() => {
    presence.value = withTiming(activeIndex >= 0 ? 1 : 0, easeStandard)

    if (slotWidth === 0 || activeIndex < 0) return
    const target = activeIndex * slotWidth + (slotWidth - INDICATOR_WIDTH) / 2

    // The first placement is not a movement — springing in from x=0 on mount
    // would announce a transition the driver did not make.
    if (placed.current) {
      offset.value = withSpring(target, settle)
    } else {
      offset.value = target
      placed.current = true
    }
  }, [activeIndex, slotWidth, offset, presence])

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: presence.value,
    transform: [{ translateX: offset.value }],
  }))

  function handleLayout(event: LayoutChangeEvent) {
    setRowWidth(event.nativeEvent.layout.width)
  }

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      <View style={[styles.bar, elevation[2]]}>
        <View style={styles.row} onLayout={handleLayout}>
          {rowWidth > 0 && (
            <Animated.View
              style={[styles.indicator, indicatorStyle]}
              pointerEvents="none"
            />
          )}

          {DESTINATIONS.map((destination) => {
            const isActive = activeName === destination.name
            const route = state.routes.find((r) => r.name === destination.name)

            function onPress() {
              if (route == null) return
              Haptics.selectionAsync().catch(() => {})
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name as never)
              }
            }

            return (
              <Pressable
                key={destination.name}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={destination.label}
                style={styles.destination}
              >
                <View style={styles.glyph}>
                  <Ionicons
                    name={isActive ? destination.icon : destination.iconOutline}
                    size={24}
                    color={isActive ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                    accessible={false}
                  />
                </View>
                <Text
                  role="labelMedium"
                  tone={isActive ? 'default' : 'variant'}
                  numberOfLines={1}
                >
                  {destination.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  // The dock is the bar's gutter, not the bar. It takes the page background so
  // the inset edges read as page showing through, and it reserves the bar's
  // layout space so content never scrolls underneath it.
  dock: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    backgroundColor: colors.surface,
  },
  bar: {
    borderRadius: shape.extraLarge,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    // No `overflow: 'hidden'` — it would clip the Android elevation shadow that
    // is the whole reason this bar reads as floating.
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    // Half the height, not `shape.full`: Android renders a 999 radius on a
    // 32dp-tall element as square corners, so the pill came out a rectangle.
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: colors.primaryContainer,
  },
  destination: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    minHeight: touch.min,
    paddingHorizontal: space.xs,
  },
  glyph: {
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
}))
