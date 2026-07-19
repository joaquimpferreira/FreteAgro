// app/(app)/historico/_layout.tsx
// Stack navigator for the trip history tab.
// index.tsx shows the list; [id].tsx (T045) will push the detail screen.

import { Stack } from 'expo-router'

export default function HistoricoLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
