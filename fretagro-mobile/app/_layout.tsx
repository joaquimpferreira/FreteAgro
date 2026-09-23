// app/_layout.tsx
// Root navigator — Expo Router entry point.
// Hydrates the Zustand store from MMKV and loads Inter before hiding the splash.
//
// The ThemeProvider sits above the navigator, not inside it, so the scheme is
// already resolved on the first frame of the first screen. Below it, `Shell`
// is a separate component for a boring reason: `useTheme` cannot be called in
// the same component that renders the provider.

// URL polyfill must be the first import — required for Supabase fetch calls on Android.
import 'react-native-url-polyfill/auto'
import { useEffect, useState } from 'react'
import { StatusBar } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter'
import { useViagemStore } from '../store/viagemStore'
import { ThemeProvider, useTheme } from '../lib/theme/ThemeProvider'

// Prevent auto-hide; we hide after MMKV hydration and font load.
SplashScreen.preventAutoHideAsync()

function Shell() {
  const { scheme, colors } = useTheme()

  return (
    <>
      {/* React Native's StatusBar, not expo-status-bar. The version this
          monorepo hoists (57.x, for a much later SDK) assumes edge-to-edge and
          silently no-ops both `backgroundColor` and `translucent`, which left
          the bar on AppCompat's default #757575 — a gray band across the top of
          every screen in both schemes.

          Transparent over a translucent bar, rather than a color: the app draws
          behind the status bar and every screen's own background fills it, so
          the band follows the scheme with nothing to keep in sync. The top
          inset is paid back by TopAppBar's `insets.top` padding. */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
        }}
      />
    </>
  )
}

export default function RootLayout() {
  const hidratarFromStorage = useViagemStore((s) => s.hidratarFromStorage)
  const [hydrated, setHydrated] = useState(false)

  // Inter is the project typeface (constitution). It was declared as a
  // dependency but never loaded, so every screen was rendering in the device's
  // system face — which on an entry-level Android is whatever the OEM shipped.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  })

  useEffect(() => {
    try {
      hidratarFromStorage()
    } catch {
      // MMKV read failed — continue with empty state rather than blocking the app.
    } finally {
      setHydrated(true)
    }
  }, [hidratarFromStorage])

  // A font that fails to load must not hold the splash forever; the system
  // face is a worse render, not a broken one.
  const ready = hydrated && (fontsLoaded || fontError != null)

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
