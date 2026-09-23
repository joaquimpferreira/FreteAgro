// components/ui/ScreenActions.tsx
// The screen's primary action, docked at the bottom edge instead of floating at
// the end of the scroll.
//
// A screen whose content is short — one open leg, one closed trip — used to end
// with its button halfway up the display and nothing under it. A screen whose
// content is long pushed the same button off the bottom, so the one thing the
// driver came to do was behind a scroll. Both are the same bug: the action was
// laid out as content. Here it is laid out as chrome.
//
// It takes the page background and carries no divider, matching TopAppBar at
// the other end. It is a sibling of the ScrollView rather than an overlay, so
// content never slides underneath it and nothing has to be padded to clear it.
//
// No safe-area inset: every screen in this app renders inside the tab navigator
// and the NavigationBar's dock, right below, already owns the bottom inset.
//
// One action, or one action and a quiet alternative — never a row of peers. The
// destructive or terminal choice stays in the content, where it is not the
// thing under the driver's thumb.

import { View } from 'react-native'
import { space } from '../../lib/theme'
import { makeStyles } from '../../lib/theme/ThemeProvider'

export interface ScreenActionsProps {
  children: React.ReactNode
}

export function ScreenActions({ children }: ScreenActionsProps) {
  const styles = useStyles()
  return <View style={styles.dock}>{children}</View>
}

const useStyles = makeStyles(({ colors }) => ({
  dock: {
    paddingHorizontal: space.base,
    paddingTop: space.md,
    gap: space.sm,
    backgroundColor: colors.surface,
  },
}))
