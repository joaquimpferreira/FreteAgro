// app/_layout.tsx
// Root navigator — Expo Router entry point.
// Hydrates the Zustand store from MMKV before hiding the splash screen.

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useViagemStore } from '../store/viagemStore'

// Prevent auto-hide; we hide after MMKV hydration
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const hidratarFromStorage = useViagemStore((s) => s.hidratarFromStorage)

  useEffect(() => {
    hidratarFromStorage()
    SplashScreen.hideAsync()
  }, [hidratarFromStorage])

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
