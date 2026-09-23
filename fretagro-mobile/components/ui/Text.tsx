// components/ui/Text.tsx
// The app's only text primitive. Every string on screen goes through it.
//
// Screens choose a role from the M3 type scale and a tone from the color
// roles; they never pick a size, weight, or hex. That is what keeps "the same
// label looks different on two screens" from happening, and it is why no
// component below this one accepts a `style` for typography.
//
// A tone is a name for a job, not for a color. `strong` is "the figure this
// screen exists to show" — on light that resolves to a deep green and on dark
// to a bright one. Naming the job rather than the value is what lets the same
// screen be correct in both schemes without a single branch in it.
//
// Figures (`figure*` roles) get tabular numerals so money and odometer
// readings line up column-wise down a list — a number that shifts sideways
// between rows is a number the driver has to re-read.

import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native'
import { type as typeScale, type ColorRoles } from '../../lib/theme'
import { useTheme } from '../../lib/theme/ThemeProvider'

type Role = keyof typeof typeScale

type Tone =
  | 'default'
  | 'variant'
  | 'faint'
  | 'primary'
  | 'strong'
  | 'error'
  | 'waiting'
  | 'onPrimaryFill'
  | 'onPrimaryContainer'
  | 'onTertiaryContainer'
  | 'onErrorContainer'
  | 'inverse'

function toneColor(tone: Tone, colors: ColorRoles): string {
  switch (tone) {
    case 'variant':
      return colors.onSurfaceVariant
    case 'faint':
      return colors.onSurfaceFaint
    case 'primary':
      return colors.primary
    case 'strong':
      return colors.primaryStrong
    case 'error':
      return colors.error
    case 'waiting':
      return colors.tertiary
    case 'onPrimaryFill':
      return colors.onPrimaryFill
    case 'onPrimaryContainer':
      return colors.onPrimaryContainer
    case 'onTertiaryContainer':
      return colors.onTertiaryContainer
    case 'onErrorContainer':
      return colors.onErrorContainer
    case 'inverse':
      return colors.inverseOnSurface
    default:
      return colors.onSurface
  }
}

// `role` here is the M3 *type* role, which shadows RN's ARIA-ish `role` prop.
// That prop is omitted deliberately: accessibility semantics on this surface
// go through `accessibilityRole`, which is the one Android actually maps.
export interface TextProps extends Omit<RNTextProps, 'style' | 'role'> {
  role?: Role
  tone?: Tone
  /** Layout only — margins, alignment, flex. Never typography or color. */
  style?: RNTextProps['style']
}

export function Text({
  role = 'bodyMedium',
  tone = 'default',
  style,
  ...props
}: TextProps) {
  const { colors } = useTheme()
  const isFigure = role.startsWith('figure')

  return (
    <RNText
      {...props}
      style={[
        typeScale[role],
        { color: toneColor(tone, colors) },
        isFigure && styles.tabular,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
})
