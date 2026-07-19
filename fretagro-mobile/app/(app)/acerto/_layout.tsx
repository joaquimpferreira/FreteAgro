// app/(app)/acerto/_layout.tsx
// Stack navigator for the acerto (financial settlement) tab.
// index.tsx shows the list; [id].tsx (T050) will push the detail screen.

import { Stack } from 'expo-router'

export default function AcertoLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
