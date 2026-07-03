// components/ui/Button.tsx
// NativeWind v4 styled button component.
// min-h-[44px] ensures touch targets meet the ≥ 44 px requirement (constitution M-Touch).

import { Pressable, Text, ActivityIndicator } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'destructive'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary active:opacity-80',
    text: 'text-black font-semibold',
  },
  secondary: {
    container: 'bg-surface border border-surface active:opacity-80',
    text: 'text-white font-semibold',
  },
  destructive: {
    container: 'bg-red-600 active:opacity-80',
    text: 'text-white font-semibold',
  },
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const { container, text } = variantStyles[variant]

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-[44px] rounded-xl px-4 items-center justify-center ${container} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <Text className={`text-base ${text}`}>{label}</Text>
      )}
    </Pressable>
  )
}
