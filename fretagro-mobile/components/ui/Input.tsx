// components/ui/Input.tsx
// NativeWind v4 styled text input.
// Used for all form fields across the app.

import { View, Text, TextInput, TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm text-gray-400 font-medium">{label}</Text>
      )}
      <TextInput
        className={`min-h-[44px] bg-surface border rounded-xl px-4 text-white text-base ${
          error ? 'border-red-500' : 'border-surface'
        }`}
        placeholderTextColor="#6b7280"
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-500">{error}</Text>
      )}
    </View>
  )
}
