// components/ui/Badge.tsx
// NativeWind v4 styled status badge.
// Used for trip status, expense type, and acerto status indicators.

import { View, Text } from 'react-native'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'muted'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-surface', text: 'text-white' },
  success: { container: 'bg-green-900', text: 'text-green-400' },
  warning: { container: 'bg-yellow-900', text: 'text-yellow-400' },
  destructive: { container: 'bg-red-900', text: 'text-red-400' },
  muted: { container: 'bg-gray-800', text: 'text-gray-400' },
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { container, text } = variantStyles[variant]

  return (
    <View className={`px-2 py-0.5 rounded-full ${container}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  )
}
