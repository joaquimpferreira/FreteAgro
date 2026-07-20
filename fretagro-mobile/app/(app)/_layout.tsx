// app/(app)/_layout.tsx
// Authenticated app shell — tab navigator for all main driver screens.
// Session guard: on mount calls mobileAuth.getSession(); if no session → Redirect to login (T019).
// T043: wires useSyncStatus on mount and on AppState 'active' foreground transition;
//        passes pendingCount to OfflineBanner; opens PendingSyncList via Modal.
// Corporate proxy note (Netscope): getSession reads from SecureStore (local) — no network call needed.

import { useEffect, useState } from 'react'
import { ActivityIndicator, AppState, AppStateStatus, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FloatingTabBar } from '../../components/ui/FloatingTabBar'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { PendingSyncList } from '../../components/ui/PendingSyncList'
import { useSyncStatus } from '../../hooks/useSync'
import { drain } from '../../lib/sync/syncQueue'
import { useViagemStore } from '../../store/viagemStore'
import { getSession } from '../../lib/auth/mobileAuth'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export default function AppLayout() {
  const { pendingCount } = useSyncStatus()
  const [pendingSyncVisible, setPendingSyncVisible] = useState(false)
  const marcarSincronizado = useViagemStore((s) => s.marcarSincronizado)
  const [authState, setAuthState] = useState<AuthState>('loading')

  // Session guard (T019) — must resolve before rendering any tab content.
  useEffect(() => {
    getSession()
      .then((session) => {
        setAuthState(session ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => setAuthState('unauthenticated'))
  }, [])

  // Drain on every app foreground transition (covers cases where connectivity
  // was already restored before the app came back — not just connectivity transitions).
  // NOTE: This hook MUST run unconditionally on every render (Rules of Hooks),
  // so it stays above the early returns below. The listener itself is harmless
  // while auth is still resolving.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          drain()
            .then(() => marcarSincronizado())
            .catch(() => {})
        }
      },
    )
    return () => subscription.remove()
  }, [marcarSincronizado])

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    )
  }

  if (authState === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <OfflineBanner
        pendingCount={pendingCount}
        onViewPending={() => setPendingSyncVisible(true)}
      />
      <PendingSyncList
        visible={pendingSyncVisible}
        onClose={() => setPendingSyncVisible(false)}
      />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: { backgroundColor: '#0D0D0D' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="historico"
          options={{
            title: 'Histórico',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="acerto"
          options={{
            title: 'Acerto',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />

        {/* ── Hidden routes: push-only, must not appear as tabs ── */}
        <Tabs.Screen name="viagem/iniciar" options={{ href: null }} />
        <Tabs.Screen name="viagem/em-curso" options={{ href: null }} />
        <Tabs.Screen name="viagem/encerrar" options={{ href: null }} />
        <Tabs.Screen name="viagem/avancar-trecho" options={{ href: null }} />
        <Tabs.Screen name="viagem/resumo" options={{ href: null }} />
        <Tabs.Screen name="despesas/abastecimento" options={{ href: null }} />
        <Tabs.Screen name="despesas/geral" options={{ href: null }} />
      </Tabs>
    </View>
  )
}
