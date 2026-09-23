// components/ui/Banner.tsx
// An inline message attached to the thing it is about.
//
// Used for validation failures and load errors. It is deliberately not a
// snackbar or a dialog: the driver may be reading this with the sun on the
// screen and a pump running, and a message that disappears on a timer is a
// message he will miss. It stays until the condition does.
//
// It fades in place rather than sliding in. A banner belongs to the field or
// card above it; travelling into position would say it came from somewhere
// else. Siblings below it settle into the new gap on the same curve, so the
// form does not jump under a thumb that is already moving toward a button.
//
// Every banner names the problem and the recovery. "Erro ao carregar" is not a
// message; "Não foi possível carregar. Toque em Tentar novamente." is.

import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import { Text } from './Text'
import { Button } from './Button'
import { shape, space, type ColorRoles } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { appear, disappear } from '../../lib/theme/motion'

type Tone = 'error' | 'waiting' | 'info'

export interface BannerProps {
  message: string
  tone?: Tone
  action?: { label: string; onPress: () => void }
}

interface ToneStyle {
  background: string
  content: string
  icon: keyof typeof Ionicons.glyphMap
  textTone: 'onErrorContainer' | 'onTertiaryContainer' | 'variant'
}

function toneStyle(tone: Tone, colors: ColorRoles): ToneStyle {
  switch (tone) {
    case 'waiting':
      return {
        background: colors.tertiaryContainer,
        content: colors.onTertiaryContainer,
        icon: 'time',
        textTone: 'onTertiaryContainer',
      }
    case 'info':
      return {
        background: colors.surfaceContainerHigh,
        content: colors.onSurfaceVariant,
        icon: 'information-circle',
        textTone: 'variant',
      }
    default:
      return {
        background: colors.errorContainer,
        content: colors.onErrorContainer,
        icon: 'alert-circle',
        textTone: 'onErrorContainer',
      }
  }
}

export function Banner({ message, tone = 'error', action }: BannerProps) {
  const { colors } = useTheme()
  const styles = useStyles()
  const t = toneStyle(tone, colors)

  return (
    <Animated.View
      entering={appear}
      exiting={disappear}
      style={[styles.banner, { backgroundColor: t.background }]}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View style={styles.row}>
        <Ionicons name={t.icon} size={20} color={t.content} accessible={false} />
        <Text role="bodyMedium" tone={t.textTone} style={styles.message}>
          {message}
        </Text>
      </View>
      {action != null && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="outlined"
          style={styles.action}
        />
      )}
    </Animated.View>
  )
}

const useStyles = makeStyles(() => ({
  banner: {
    borderRadius: shape.medium,
    padding: space.base,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  message: {
    flex: 1,
  },
  action: {
    alignSelf: 'flex-start',
  },
}))
