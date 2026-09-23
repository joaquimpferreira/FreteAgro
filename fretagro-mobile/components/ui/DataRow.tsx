// components/ui/DataRow.tsx
// A label/value pair, baseline-aligned, value right-set.
//
// This is the most repeated shape in the app — every odometer reading, fuel
// total, commission line and deduction is one of these. Having it as one
// component is what makes the figures line up down a column across screens
// that were written months apart.

import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text } from './Text'
import { space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'

type Emphasis = 'normal' | 'strong' | 'positive' | 'negative'

export interface DataRowProps {
  label: string
  value: string
  /** Draws a hairline above the row — use it for the line that totals the ones above. */
  divided?: boolean
  emphasis?: Emphasis
  style?: ViewStyle
}

export function DataRow({ label, value, divided = false, emphasis = 'normal', style }: DataRowProps) {
  const styles = useStyles()
  const isTotal = emphasis !== 'normal'

  return (
    <View style={[styles.row, divided && styles.divided, style]}>
      <Text
        role={isTotal ? 'titleSmall' : 'bodyMedium'}
        tone={isTotal ? 'default' : 'variant'}
        style={styles.label}
      >
        {label}
      </Text>
      <Text
        role={isTotal ? 'figureSmall' : 'bodyMedium'}
        tone={
          emphasis === 'positive' ? 'strong' : emphasis === 'negative' ? 'error' : 'default'
        }
      >
        {value}
      </Text>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.base,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: space.md,
    marginTop: space.xs,
  },
  label: {
    flexShrink: 1,
  },
}))
