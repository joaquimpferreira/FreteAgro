// components/ui/Card.tsx
// NativeWind v4 styled surface container.
// Used as the base container for data sections throughout the app.

import { View, ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  children: React.ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-2xl p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  )
}
