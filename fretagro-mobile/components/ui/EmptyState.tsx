// components/ui/EmptyState.tsx
// An empty list that teaches the screen instead of announcing its emptiness.
//
// "Nenhum item" tells the driver nothing he did not already see. Each empty
// state here says what the screen will hold, why it is empty right now, and —
// when there is one — offers the action that fills it.

import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import { Text } from './Text'
import { Button } from './Button'
import { shape, space } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { reveal } from '../../lib/theme/motion'

type IoniconName = keyof typeof Ionicons.glyphMap

export interface EmptyStateProps {
  icon: IoniconName
  /** What this screen holds, stated positively. */
  title: string
  /** Why it is empty now, and what will change that. */
  description: string
  action?: { label: string; onPress: () => void; icon?: IoniconName }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme()
  const styles = useStyles()

  return (
    <Animated.View entering={reveal()} style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={32} color={colors.onSurfaceVariant} accessible={false} />
      </View>
      <Text role="titleLarge" style={styles.centered}>
        {title}
      </Text>
      <Text role="bodyMedium" tone="variant" style={styles.centered}>
        {description}
      </Text>
      {action != null && (
        <Button
          label={action.label}
          onPress={action.onPress}
          icon={action.icon}
          variant="tonal"
          style={styles.action}
        />
      )}
    </Animated.View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  container: {
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xxxl,
    paddingHorizontal: space.xl,
  },
  badge: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: space.xs,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    marginTop: space.sm,
  },
}))
