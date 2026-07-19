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

const inlineVariantStyles: Record<ButtonVariant, { container: object; text: object }> = {
  primary: {
    container: { backgroundColor: '#22C55E' },
    text: { color: '#000', fontWeight: '600' as const },
  },
  secondary: {
    container: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#1f1f1f' },
    text: { color: '#fff', fontWeight: '600' as const },
  },
  destructive: {
    container: { backgroundColor: '#ef4444' },
    text: { color: '#fff', fontWeight: '600' as const },
  },
}

const nativewindVariantStyles: Record<ButtonVariant, { container: string; text: string }> = {
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
  const { container: containerClass, text: textClass } = nativewindVariantStyles[variant]
  const { container: containerStyle, text: textStyle } = inlineVariantStyles[variant]

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        { minHeight: 44, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
        containerStyle,
        (disabled || loading) ? { opacity: 0.5 } : {},
      ]}
      className={`min-h-[44px] rounded-xl px-4 items-center justify-center ${containerClass} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <Text style={[{ fontSize: 16 }, textStyle]} className={`text-base ${textClass}`}>{label}</Text>
      )}
    </Pressable>
  )
}
