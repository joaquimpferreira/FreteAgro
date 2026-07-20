// components/ui/FloatingTabBar.tsx
// Clean, professional floating "pill" bottom navigation bar.
// Purely presentational — navigation behaviour (routes, tabPress, guards) is
// unchanged; this only replaces the default tab bar UI via the Tabs `tabBar` prop.
// The outer container is a normal (non-absolute) layout element so the scene
// still reserves space for it — no screen padding changes required.

import { View, Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

type IoniconName = keyof typeof Ionicons.glyphMap

interface TabDef {
  name: string
  label: string
  icon: IoniconName
  iconOutline: IoniconName
}

// Visible tabs only — hidden push-only routes (viagem/*, despesas/*) are excluded.
const TABS: readonly TabDef[] = [
  { name: 'index', label: 'Início', icon: 'home', iconOutline: 'home-outline' },
  { name: 'historico', label: 'Histórico', icon: 'time', iconOutline: 'time-outline' },
  { name: 'acerto', label: 'Acerto', icon: 'cash', iconOutline: 'cash-outline' },
  { name: 'perfil', label: 'Perfil', icon: 'person', iconOutline: 'person-outline' },
]

const ACTIVE = '#22C55E'
const INACTIVE = '#8b8f97'

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const activeName = state.routes[state.index]?.name

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const isActive = activeName === tab.name
          const route = state.routes.find((r) => r.name === tab.name)

          const onPress = () => {
            if (!route) return
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
              key={tab.name}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              style={[styles.item, isActive && styles.itemActive]}
            >
              <Ionicons
                name={isActive ? tab.icon : tab.iconOutline}
                size={22}
                color={isActive ? ACTIVE : INACTIVE}
              />
              {isActive && <Text style={styles.label}>{tab.label}</Text>}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161616',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    padding: 6,
    // Subtle elevation for the floating feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  itemActive: {
    backgroundColor: 'rgba(34,197,94,0.14)',
  },
  label: {
    color: ACTIVE,
    fontSize: 13,
    fontWeight: '600',
  },
})
