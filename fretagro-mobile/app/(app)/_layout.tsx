// app/(app)/_layout.tsx
// Authenticated app shell — M3 navigation bar over the four driver destinations.
// Session guard: on mount calls mobileAuth.getSession(); no session → Redirect to login (T019).
// Drains the sync queue on every foreground transition.
//
// The offline banner and the pending-sync modal no longer live here: SyncStatus
// is self-contained and each screen places it in its own content flow, which is
// what let the connectivity state stop being a system-level red bar.
//
// Corporate proxy note (Netscope): getSession reads from SecureStore (local) — no network call.

import { useEffect, useState } from 'react'
import { ActivityIndicator, AppState, AppStateStatus, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { NavigationBar } from '../../components/ui/NavigationBar'
import { drain } from '../../lib/sync/syncQueue'
import { useViagemStore } from '../../store/viagemStore'
import { getSession } from '../../lib/auth/mobileAuth'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export default function AppLayout() {
  const { colors } = useTheme()
  const styles = useStyles()
  const [authState, setAuthState] = useState<AuthState>('loading')
  const marcarSincronizado = useViagemStore((s) => s.marcarSincronizado)

  // Session guard (T019) — must resolve before rendering any tab content.
  useEffect(() => {
    getSession()
      .then((session) => setAuthState(session ? 'authenticated' : 'unauthenticated'))
      .catch(() => setAuthState('unauthenticated'))
  }, [])

  // Drain on every app foreground transition (covers cases where connectivity
  // was already restored before the app came back — not just transitions).
  // NOTE: This hook MUST run unconditionally on every render (Rules of Hooks),
  // so it stays above the early returns below.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        drain()
          .then(() => marcarSincronizado())
          .catch(() => {})
      }
    })
    return () => subscription.remove()
  }, [marcarSincronizado])

  if (authState === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (authState === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      tabBar={(props) => <NavigationBar {...props} />}
      sceneContainerStyle={{ backgroundColor: colors.surface }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="historico" options={{ title: 'Viagens' }} />
      <Tabs.Screen name="acerto" options={{ title: 'Acerto' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />

      {/* ── Hidden routes: push-only, must not appear as destinations ── */}
      <Tabs.Screen name="viagem/iniciar" options={{ href: null }} />
      <Tabs.Screen name="viagem/em-curso" options={{ href: null }} />
      <Tabs.Screen name="viagem/encerrar" options={{ href: null }} />
      <Tabs.Screen name="viagem/avancar-trecho" options={{ href: null }} />
      <Tabs.Screen name="viagem/resumo" options={{ href: null }} />
      <Tabs.Screen name="despesas/abastecimento" options={{ href: null }} />
      <Tabs.Screen name="despesas/geral" options={{ href: null }} />
    </Tabs>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
}))
