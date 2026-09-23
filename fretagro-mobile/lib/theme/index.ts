// lib/theme/index.ts
// Design tokens for the driver app, in two schemes.
//
// The app is light by default and follows the system into dark. The default is
// light and not dark for one reason recorded in PRODUCT.md: this screen is read
// standing at a fuel pump in direct sun on an entry-level LCD. Outdoors, a dark
// surface is a mirror — the driver reads his own reflection before he reads the
// figure. A white ground under near-black text is the only arrangement that
// survives that. Dark is kept for the night stretch, where it is the right one.
//
// Scheme structure is Material 3, seeded from the FreteAgro brand green
// `#16b84f`. Every text role below is measured against its intended surface and
// annotated with the contrast ratio it actually achieves.
//
// Depth is scheme-dependent, and deliberately so. On dark, M3 steps the surface
// tone and casts no shadow. On light, tone steps are invisible — white on
// off-white is not a step — so depth is a soft shadow instead. `elevation`
// below carries whichever of the two the active scheme uses, which is why no
// component ever picks a shadow itself.
//
// This module imports nothing. Colors are declared here and nowhere else — a
// literal hex in a component or screen is a bug (constitution: design tokens
// only). Nothing imports `colors` directly either: the scheme is only knowable
// at render time, so components reach it through `useTheme`/`makeStyles`.

/** Tonal palette derived from the brand green. Exposed for roles only. */
const greenTones = {
  t0: '#000000',
  t10: '#00210e',
  t20: '#00391c',
  t30: '#00522a',
  t40: '#006d39',
  t50: '#008a49',
  t60: '#16b84f',
  t70: '#3fc474',
  t80: '#5ee08e',
  t90: '#8ff7ad',
  t95: '#c6ffd3',
} as const

/**
 * The color roles every component speaks in. Both schemes implement all of
 * them, so a component never branches on the scheme — it names a role and gets
 * whichever value is correct where it is being drawn.
 */
export interface ColorRoles {
  // ── Primary ──
  //
  // Three roles, not M3's two, because the brand green cannot do both jobs on a
  // white ground. `#16b84f` on white measures 2.2:1 — fine as a fill, illegible
  // as text. So the fill and the accent are separated: `primaryFill` stays
  // brand-exact in both schemes, and `primary` is whatever is legible as text
  // on the local surface.

  /** Accent for text, icons and focused borders drawn *on* a surface. */
  primary: string
  /** The brand-green fill behind the one primary action on a screen. */
  primaryFill: string
  /** Label and icon on top of `primaryFill`. 6.5:1 against it, both schemes. */
  onPrimaryFill: string
  /** Tonal (secondary-emphasis) fill: tonal buttons, selected chips, nav pill. */
  primaryContainer: string
  /** Label on `primaryContainer`. */
  onPrimaryContainer: string
  /** The one figure per screen that must carry — the settlement balance. */
  primaryStrong: string

  // ── Tertiary: "waiting", not "wrong". Offline and queued items live here. ──
  // Amber reads as attention without claiming a failure. Never the only signal:
  // every state that uses it also carries a written label.
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string

  // ── Error: validation failures and destructive actions only. ──
  // Losing signal is not an error; it must never render in these roles.
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string

  // ── Surfaces ──
  /** App background. */
  surface: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string

  /** Primary text. */
  onSurface: string
  /** Secondary text and inactive icons. */
  onSurfaceVariant: string
  /** The floor for any text in this app. Nothing quieter ships. */
  onSurfaceFaint: string

  /** Borders on interactive elements. ≥3:1 on `surface` in both schemes. */
  outline: string
  /** Dividers and decorative rules. Non-informational only. */
  outlineVariant: string

  /** Scrim behind modals and sheets. */
  scrim: string
  /** The color a shadow is cast in. Meaningful on light; unused on dark. */
  shadow: string

  /** Inverse pair, used by snackbars so they read as system voice, not content. */
  inverseSurface: string
  inverseOnSurface: string
  inversePrimary: string
}

/**
 * Light — the default, and the scheme the app is designed in.
 *
 * The ground is a faintly green off-white rather than pure `#ffffff`, so that
 * cards can be pure white and separate from it without needing a heavy shadow
 * to do the work. That is the whole depth system on this scheme: white card,
 * near-white ground, soft shadow.
 */
const light: ColorRoles = {
  primary: greenTones.t40, //           6.5:1 on a white card
  primaryFill: greenTones.t60, //       the brand green, unmodified
  onPrimaryFill: greenTones.t10, //     6.5:1 on primaryFill
  primaryContainer: '#c8f2d6',
  onPrimaryContainer: '#00351a', //    11.4:1 on primaryContainer
  primaryStrong: greenTones.t30, //     9.4:1 on a white card

  tertiary: '#7a4f00', //               7.1:1 on a white card
  onTertiary: '#ffffff',
  tertiaryContainer: '#ffe5bc',
  onTertiaryContainer: '#4a2f00', //   10.1:1 on tertiaryContainer

  error: '#b3261e', //                  6.5:1 on a white card
  onError: '#ffffff',
  errorContainer: '#ffdad5',
  onErrorContainer: '#5f1410',

  surface: '#f4f6f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#ffffff',
  surfaceContainer: '#ffffff',
  surfaceContainerHigh: '#eaefeb',
  surfaceContainerHighest: '#dfe6e1',

  onSurface: '#101512', //             17.4:1 on surface
  onSurfaceVariant: '#485249', //       7.5:1 on surface
  onSurfaceFaint: '#545e56', //         6.2:1 on surface
  outline: '#79837b', //                3.6:1 on surface
  outlineVariant: '#d5ddd7',

  scrim: 'rgba(16, 21, 18, 0.45)',
  shadow: '#0b1a10',

  inverseSurface: '#2c322e',
  inverseOnSurface: '#eff2ee',
  inversePrimary: greenTones.t80,
}

/**
 * Dark — the night stretch.
 *
 * Pulled toward M3's high-contrast dark variant rather than the default: M3's
 * on-surface-variant tone (~80) is not legible on a cheap LCD with headlights
 * and a dash reflection in the glass.
 */
const dark: ColorRoles = {
  primary: greenTones.t60, //           7.2:1 on surface
  primaryFill: greenTones.t60,
  onPrimaryFill: greenTones.t10, //     6.5:1 on primaryFill
  primaryContainer: greenTones.t30,
  onPrimaryContainer: greenTones.t95, // 8.9:1 on primaryContainer
  primaryStrong: '#1bde5f',

  tertiary: '#ffd08a',
  onTertiary: '#452b00',
  tertiaryContainer: '#633f00',
  onTertiaryContainer: '#ffdcb1',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  surface: '#0f1311',
  surfaceContainerLowest: '#0a0d0b',
  surfaceContainerLow: '#171b18',
  surfaceContainer: '#1b201d',
  surfaceContainerHigh: '#252b27',
  surfaceContainerHighest: '#303632',

  onSurface: '#f4f6f3', //             17.2:1 on surface
  onSurfaceVariant: '#c8d2cb', //      12.1:1 on surface
  onSurfaceFaint: '#9aa69e', //         7.4:1 on surface
  outline: '#8b968e', //                3.4:1 on surface
  outlineVariant: '#414941',

  scrim: 'rgba(0, 0, 0, 0.72)',
  shadow: '#000000',

  inverseSurface: '#e2e5e0',
  inverseOnSurface: '#191c1a',
  inversePrimary: greenTones.t40,
}

/** One elevation step: a background, and — on light only — the shadow above it. */
export interface ElevationStyle {
  backgroundColor: string
  shadowColor: string
  shadowOpacity: number
  shadowRadius: number
  shadowOffset: { width: number; height: number }
  /** Android's own shadow. Note: a parent with `overflow: 'hidden'` clips it. */
  elevation: number
}

export type ElevationScale = readonly [
  ElevationStyle,
  ElevationStyle,
  ElevationStyle,
  ElevationStyle,
  ElevationStyle,
]

function flat(backgroundColor: string, shadowColor: string): ElevationStyle {
  return {
    backgroundColor,
    shadowColor,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  }
}

function lifted(
  backgroundColor: string,
  shadowColor: string,
  opacity: number,
  radius: number,
  offsetY: number,
  androidElevation: number,
): ElevationStyle {
  return {
    backgroundColor,
    shadowColor,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
    elevation: androidElevation,
  }
}

// Light: white cards lifted off an off-white ground. The shadows are wide and
// very low-opacity on purpose — a tight, dark shadow reads as a 2010s card and
// also costs more to composite than a soft one on an entry-level GPU.
const lightElevation: ElevationScale = [
  flat(light.surface, light.shadow),
  lifted(light.surfaceContainerLow, light.shadow, 0.05, 12, 2, 2),
  lifted(light.surfaceContainer, light.shadow, 0.07, 18, 4, 4),
  lifted(light.surfaceContainerHigh, light.shadow, 0.09, 24, 8, 8),
  lifted(light.surfaceContainerHighest, light.shadow, 0.11, 32, 12, 12),
]

// Dark: tonal steps, no shadow. A shadow on a near-black ground is invisible
// and still pays the compositing cost.
const darkElevation: ElevationScale = [
  flat(dark.surface, dark.shadow),
  flat(dark.surfaceContainerLow, dark.shadow),
  flat(dark.surfaceContainer, dark.shadow),
  flat(dark.surfaceContainerHigh, dark.shadow),
  flat(dark.surfaceContainerHighest, dark.shadow),
]

/**
 * M3 type scale. Sizes are in sp — React Native scales them with the system
 * font-size setting automatically, which is why no size here is hardcoded in
 * a component. `allowFontScaling` is left on everywhere for the same reason.
 *
 * Scheme-independent: type does not change between light and dark.
 */
export const type = {
  displayLarge: { fontSize: 57, lineHeight: 64, letterSpacing: -0.25, fontFamily: 'Inter_400Regular' },
  displayMedium: { fontSize: 45, lineHeight: 52, letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  displaySmall: { fontSize: 36, lineHeight: 44, letterSpacing: 0, fontFamily: 'Inter_400Regular' },

  headlineLarge: { fontSize: 32, lineHeight: 40, letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  headlineMedium: { fontSize: 28, lineHeight: 36, letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  headlineSmall: { fontSize: 24, lineHeight: 32, letterSpacing: 0, fontFamily: 'Inter_400Regular' },

  titleLarge: { fontSize: 22, lineHeight: 28, letterSpacing: 0, fontFamily: 'Inter_500Medium' },
  titleMedium: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontFamily: 'Inter_500Medium' },
  titleSmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontFamily: 'Inter_500Medium' },

  bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0.5, fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25, fontFamily: 'Inter_400Regular' },
  bodySmall: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontFamily: 'Inter_400Regular' },

  labelLarge: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontFamily: 'Inter_500Medium' },
  labelMedium: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5, fontFamily: 'Inter_500Medium' },
  labelSmall: { fontSize: 11, lineHeight: 16, letterSpacing: 0.5, fontFamily: 'Inter_500Medium' },

  /** Figures the driver compares column-wise: money, odometer, litres.
   *  Semibold so a number outweighs its own label at the same size. */
  figureDisplay: { fontSize: 48, lineHeight: 56, letterSpacing: -1.2, fontFamily: 'Inter_600SemiBold' },
  figureLarge: { fontSize: 36, lineHeight: 44, letterSpacing: -0.5, fontFamily: 'Inter_600SemiBold' },
  figureMedium: { fontSize: 22, lineHeight: 28, letterSpacing: -0.25, fontFamily: 'Inter_600SemiBold' },
  figureSmall: { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontFamily: 'Inter_600SemiBold' },
} as const

/**
 * Shape scale. Rounder than stock M3 at the container sizes: a 20–28dp card
 * radius is what makes a white card on a white-ish ground read as an object
 * rather than as a cropped region of the page.
 */
export const shape = {
  none: 0,
  extraSmall: 8,
  small: 12,
  medium: 16,
  large: 20,
  extraLarge: 28,
  full: 999,
} as const

/** 4dp grid. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

/**
 * Minimum interactive sizes. M3 asks for 48×48dp with 8dp between targets;
 * the real scene here is a standing driver with dirty hands, so the primary
 * action on a screen takes `actionHeight` rather than the 48dp floor.
 */
export const touch = {
  /** Absolute floor for any tappable element. */
  min: 48,
  /** Gap between adjacent targets. */
  gap: 8,
  /** Full-width primary action. */
  actionHeight: 56,
} as const

/**
 * Durations in ms. Motion in this app states a change; it never decorates.
 * The named curves and springs that go with these live in `./motion`.
 */
export const duration = {
  /** State flips that must feel instant: press, selection. */
  short: 120,
  /** The default for anything the eye should follow. */
  medium: 220,
  /** Entrances, and anything crossing a large part of the screen. */
  long: 320,
} as const

export type Scheme = 'light' | 'dark'

export interface Theme {
  scheme: Scheme
  colors: ColorRoles
  elevation: ElevationScale
  type: typeof type
  shape: typeof shape
  space: typeof space
  touch: typeof touch
  duration: typeof duration
}

export const themes: Record<Scheme, Theme> = {
  light: {
    scheme: 'light',
    colors: light,
    elevation: lightElevation,
    type,
    shape,
    space,
    touch,
    duration,
  },
  dark: {
    scheme: 'dark',
    colors: dark,
    elevation: darkElevation,
    type,
    shape,
    space,
    touch,
    duration,
  },
}
