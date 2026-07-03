// app/(auth)/_layout.tsx
// Stack navigator for unauthenticated screens (login and ativar).
// No auth guard — accessible when unauthenticated.
// OfflineBanner is rendered here so it appears on all auth screens (FR-007).

import { View } from 'react-native'
import { Stack } from 'expo-router'
import { OfflineBanner } from '../../components/ui/OfflineBanner'

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  )
}
