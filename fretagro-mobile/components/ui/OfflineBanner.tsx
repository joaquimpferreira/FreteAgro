// components/ui/OfflineBanner.tsx
// Permanently visible banner when the device is offline (FR-007).
// Cannot be dismissed. Shows pending sync count when > 0.
// "Ver pendentes" Pressable is wired by T043 (app/(app)/_layout.tsx).

import { View, Text, Pressable } from 'react-native'
import { useConectividade } from '../../hooks/useConectividade'

interface OfflineBannerProps {
  /** Number of operations pending sync (supplied by useSync once wired in T043). */
  pendingCount?: number
  /** Called when "Ver pendentes" is pressed — opens PendingSyncList modal (T058). */
  onViewPending?: () => void
}

export function OfflineBanner({ pendingCount = 0, onViewPending }: OfflineBannerProps) {
  const { isConnected } = useConectividade()

  if (isConnected) return null

  return (
    <View className="bg-red-900 px-4 py-2 flex-row items-center justify-between">
      <Text className="text-red-200 text-sm font-medium">
        Sem conexão
        {pendingCount > 0 ? ` · ${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'} pendentes de sincronização` : ''}
      </Text>
      {pendingCount > 0 && onViewPending && (
        <Pressable
          onPress={onViewPending}
          className="min-h-[44px] px-2 justify-center"
          accessibilityRole="button"
          accessibilityLabel={`Ver ${pendingCount} itens pendentes`}
        >
          <Text className="text-red-300 text-sm underline">Ver pendentes ({pendingCount})</Text>
        </Pressable>
      )}
    </View>
  )
}
