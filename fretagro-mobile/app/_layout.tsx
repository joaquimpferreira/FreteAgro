// app/_layout.tsx
// Root navigator — Expo Router entry point.
// Hydrates the Zustand store from MMKV before hiding the splash screen.

// URL polyfill must be the first import — required for Supabase fetch calls on Android.
import 'react-native-url-polyfill/auto'
import '../global.css'
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
    try {
      hidratarFromStorage()
    } catch (e) {
      // MMKV read failed — continue with empty state
    } finally {
      SplashScreen.hideAsync()
    }
  }, [hidratarFromStorage])

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D0D' },
        }}
      />
    </SafeAreaProvider>
  )
}
