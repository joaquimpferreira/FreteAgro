// components/ui/Surface.tsx
// A container that carries depth.
//
// What "depth" means is the scheme's business, not this component's: on dark it
// is a step in surface tone, on light it is a white card and a soft shadow.
// Both arrive through `theme.elevation[level]`, so a screen asks for level 1
// and gets whichever of the two is correct where it is drawn.
//
// Nesting a Surface inside a Surface at the same level is a bug — on dark the
// step disappears and on light the shadow doubles into a smudge. Step the
// level instead, or pass `outlined` if the inner thing only needs separating.
//
// `reveal` opts the card into the screen's entrance. Pass its index among its
// siblings and it arrives in reading order; omit it and the card is static.

import Animated from 'react-native-reanimated'
import type { ViewProps } from 'react-native'
import { shape, space } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { reveal as revealAnimation } from '../../lib/theme/motion'

type Level = 0 | 1 | 2 | 3 | 4

export interface SurfaceProps extends ViewProps {
  /** Tonal/shadow elevation step. 1 is the default resting card on the background. */
  level?: Level
  /** Shape scale key. Cards are `large`; rows inside a card are `medium`. */
  radius?: keyof typeof shape
  /** Inner padding from the 4dp grid. Pass `none` when children own their own. */
  padding?: keyof typeof space | 'none'
  /** Hairline outline, for a container that must separate without a depth step. */
  outlined?: boolean
  /** Position among sibling cards, for the staggered entrance. Omit to stay still. */
  reveal?: number
}

export function Surface({
  level = 1,
  radius = 'large',
  padding = 'base',
  outlined = false,
  reveal,
  style,
  ...props
}: SurfaceProps) {
  const { elevation } = useTheme()
  const styles = useStyles()

  return (
    <Animated.View
      {...props}
      entering={reveal === undefined ? undefined : revealAnimation(reveal)}
      style={[
        elevation[level],
        { borderRadius: shape[radius] },
        padding !== 'none' && { padding: space[padding] },
        outlined && styles.outlined,
        style,
      ]}
    />
  )
}

const useStyles = makeStyles(({ colors }) => ({
  outlined: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
}))
