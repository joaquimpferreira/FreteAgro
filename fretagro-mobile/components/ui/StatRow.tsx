// components/ui/StatRow.tsx
// Two or three figures the driver reads side by side, as one band.
//
// This is not DataRow. DataRow is a label and its value on one line, stacked
// into a column the eye scans downward — the right shape for arithmetic that
// adds up to a total. StatRow is the opposite job: unrelated figures that are
// each a headline of their own, compared at a glance rather than summed.
//
// It exists because several screens had a card carrying one sentence and a
// button, with figures the driver had already recorded sitting unused further
// down the screen. Pulling them up costs no new interaction and no new concept:
// every number here is one he entered himself.
//
// Three items drop to the smaller figure role. A phone at 360dp gives each
// column about 100dp, and "R$ 1.242,00" set at 22sp does not fit in it — least
// of all with the system font scaled up, which is the setting this driver is
// most likely to be running.

import { View, StyleSheet } from 'react-native'
import { Text } from './Text'
import { space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'

export interface Stat {
  label: string
  value: string
  /** Renders the figure in the "this is the good number" role. One per band. */
  emphasis?: boolean
}

export interface StatRowProps {
  /** Two or three. More than three does not fit a phone column. */
  items: Stat[]
  /** Hairline above the band, for when it closes a card rather than opens it. */
  divided?: boolean
}

export function StatRow({ items, divided = false }: StatRowProps) {
  const styles = useStyles()
  const figureRole = items.length > 2 ? 'figureSmall' : 'figureMedium'

  return (
    <View style={[styles.band, divided && styles.divided]}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.stat, index > 0 && styles.inset]}>
          {index > 0 && <View style={styles.rule} />}
          <Text role="labelMedium" tone="variant" numberOfLines={1}>
            {item.label}
          </Text>
          <Text
            role={figureRole}
            tone={item.emphasis ? 'strong' : 'default'}
            numberOfLines={1}
            // A column is about 140dp wide and "R$ 1.242,00" nearly fills it at
            // the base size. With the system font scaled up — the setting this
            // driver is most likely to be running — it would ellipsize, and a
            // truncated money figure is worse than a slightly smaller one.
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  band: {
    flexDirection: 'row',
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: space.base,
    marginTop: space.xs,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  // Only columns that carry a rule are indented — the first one sits flush with
  // the card's own padding, because it has no rule to clear.
  inset: {
    paddingLeft: space.md,
  },
  rule: {
    position: 'absolute',
    left: 0,
    top: 2,
    bottom: 2,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
  },
}))
