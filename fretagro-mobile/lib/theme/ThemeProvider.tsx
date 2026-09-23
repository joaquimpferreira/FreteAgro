// lib/theme/ThemeProvider.tsx
// Makes the active scheme available to every component, and gives them a way
// to build a StyleSheet that depends on it.
//
// The app follows the system appearance. There is no in-app toggle: the driver
// this app is built for does not go looking for a theme setting, and the OS
// already knows whether it is day or night. If one is ever wanted, this is the
// single place that decides — swap `useColorScheme()` for a stored preference
// and every screen follows.
//
// `makeStyles` exists because `StyleSheet.create` is a module-level call and
// the scheme is only knowable at render time. Rebuilding a sheet on every
// render would be the obvious fix and the wrong one on an entry-level Android,
// so each sheet is built at most once per scheme and cached — two sheets per
// file, for the life of the process.

import { createContext, useContext, type ReactNode } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import { themes, type Scheme, type Theme } from './index'

const ThemeContext = createContext<Theme>(themes.light)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // `null` means the OS did not say — light is the documented default for this
  // app, because the daylight case is the one it is designed around.
  const system = useColorScheme()
  const theme = system === 'dark' ? themes.dark : themes.light

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

/** The active theme. Use it for values a StyleSheet cannot hold — an icon
 *  color, a ripple color, an `ActivityIndicator` tint. */
export function useTheme(): Theme {
  return useContext(ThemeContext)
}

/**
 * Declare a scheme-aware StyleSheet next to the component that owns it, the
 * same way `StyleSheet.create` is declared today:
 *
 *   const useStyles = makeStyles(({ colors, space }) => ({
 *     card: { backgroundColor: colors.surface, padding: space.base },
 *   }))
 *
 *   function Card() {
 *     const styles = useStyles()
 *     ...
 *   }
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T & StyleSheet.NamedStyles<T>,
): () => T {
  const cache = new Map<Scheme, T>()

  return function useStyles(): T {
    const theme = useTheme()
    let sheet = cache.get(theme.scheme)
    if (sheet === undefined) {
      sheet = StyleSheet.create(factory(theme))
      cache.set(theme.scheme, sheet)
    }
    return sheet
  }
}
