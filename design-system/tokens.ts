/**
 * Design System Tokens — Rayna UI v1.0
 * Source: https://www.figma.com/design/7nT1oJXd6OPArzemqVvhJB
 *
 * Sections:
 *  1. Colors  (Primary · Secondary · Success · Warning · Error · Grey · Shade · OfficeBrown)
 *  2. Dark Mode Surface Tokens  (backgrounds · cards · overlays)
 *  3. Gradients
 *  4. Typography  (Display · Heading · Paragraph · Caption)
 *  5. Shadows / Effects
 *  6. Glassmorphism / Blur
 *  7. Spacing
 *  8. Border Radius
 *  9. Component Inventory
 *
 * Dashboard identity:
 *  - Dark sidebar/header: grey-900 (#101928)
 *  - Elevated nav card:   grey-800 (#1d2739)
 *  - Dark feature card:   #232323 + black overlay @20%
 *  - Balance card base:   #040404
 *  - Glass texture:       SOFT_LIGHT blendMode on #0c0b0b layer
 *  - Feature gradient:    #0f1624 → #0640b5 (transparent dark → brand blue)
 *  - Page corner clip:    border-radius 28px
 *  - Card border-radius:  10px
 *  - Panel border-radius: 24px
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  /** Brand green – primary action */
  primary: {
    50:  '#e8fff0',
    75:  '#adffc9',
    100: '#6cffa0',
    200: '#1ef76a',
    300: '#1bde5f',
    400: '#16b84f', // base
    500: '#0e7833',
    600: '#0a6229',
    700: '#0a4d21',
    800: '#073818',
    900: '#021d0b',
  },

  /** Brand blue – secondary / informational */
  secondary: {
    50:  '#e3effc',
    75:  '#c6ddf7',
    100: '#b6d8ff',
    200: '#80bbff',
    300: '#3d89df',
    400: '#1671d9', // base
    500: '#0d5eba',
    600: '#034592',
    700: '#04326b',
    800: '#012657',
    900: '#001633',
  },

  /** Positive / confirmed states */
  success: {
    50:  '#e7f6ec',
    75:  '#b5e3c4',
    100: '#91d6a8',
    200: '#5fc381',
    300: '#40b869',
    400: '#0f973d', // base
    500: '#099137',
    600: '#04802e',
    700: '#036b26',
    800: '#015b20',
    900: '#004617',
  },

  /** Caution / pending states */
  warning: {
    50:  '#fef6e7',
    75:  '#fbe2b7',
    100: '#f7d394',
    200: '#f7c164',
    300: '#f5b546',
    400: '#f3a218',
    500: '#dd900d',
    600: '#ad6f07',
    700: '#865503',
    800: '#664101',
    900: '#523300',
  },

  /** Destructive / error states */
  error: {
    50:  '#fbeae9',
    75:  '#f2bcba',
    100: '#eb9b98',
    200: '#e26e6a',
    300: '#dd524d',
    400: '#d42620', // base
    500: '#cb1a14',
    600: '#ba110b',
    700: '#9e0a05',
    800: '#800501',
    900: '#591000',
  },

  /** Neutral grey ramp */
  grey: {
    50:  '#f9fafb',
    75:  '#f7f9fc',
    100: '#f0f2f5',
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667185',
    600: '#475367',
    700: '#344054',
    800: '#1d2739',
    900: '#101928',
  },

  /** Absolute shades */
  shade: {
    white:       '#ffffff',
    black:       '#000000',
    background500: '#121212',
    background900: '#0b0b08',
  },

  /** Warm brown accent */
  officeBrown: {
    50:  '#fbf1f1',
    75:  '#f0e6e6',
    100: '#e4dbdb',
    200: '#cdc4c4',
    300: '#b7afaf',
    400: '#a29999',
    500: '#8d8484',
    600: '#787070',
    700: '#645d5d',
    800: '#514a4a',
    900: '#3e3838',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. DARK MODE SURFACE TOKENS
//    Observed directly in Fintech + Solar dashboard templates.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semantic surface tokens for dark-background dashboard layouts.
 *
 * Usage hierarchy (deepest = darkest):
 *   darkSurface.page → sidebar + full-page backgrounds
 *   darkSurface.nav  → sidebar featured / nav cards
 *   darkSurface.card → elevated dark cards, panels
 *   darkSurface.cardBase → balance card solid black base
 *   darkSurface.overlay  → semi-transparent black overlay layered on cards
 *   darkSurface.texture  → SOFT_LIGHT blended texture for glassmorphism feel
 */
export const darkSurface = {
  /** Sidebar, top bar, page-level background: grey-900 */
  page:     '#101928',

  /** Elevated nav card inside sidebar: grey-800 */
  nav:      '#1d2739',

  /** Dark elevated card background */
  card:     '#232323',

  /** Solid near-black base for balance / feature cards */
  cardBase: '#040404',

  /** Semi-transparent black layered above card for depth */
  overlay:  'rgba(0, 0, 0, 0.20)',

  /**
   * Soft-light texture layer (SOFT_LIGHT blendMode in Figma).
   * Apply as a pseudo-element or overlay with mix-blend-mode: soft-light.
   */
  texture:  '#0c0b0b',

  /** Near-white content canvas (inside rounded-24 panel) */
  canvas:   '#fdfdfd',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. GRADIENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gradient tokens extracted from dashboard templates.
 * Use these as CSS `background` or `background-image` values.
 */
export const gradients = {
  /**
   * Feature card gradient — dark transparent → brand blue.
   * Used on Solar Sales / Fintech hero cards.
   * CSS: linear-gradient(to bottom right, #0f1624, #0640b5)
   */
  brandBlue: 'linear-gradient(135deg, rgba(15,22,36,0) 0%, #0640b5 100%)',

  /**
   * Primary green gradient — light tint → brand green.
   * Suitable for call-to-action banners.
   */
  brandGreen: 'linear-gradient(135deg, #e8fff0 0%, #16b84f 100%)',

  /**
   * Dark card gradient — adds subtle dimensionality on dark surfaces.
   */
  darkCard: 'linear-gradient(180deg, rgba(35,35,35,1) 0%, rgba(4,4,4,1) 100%)',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Font family used throughout the system.
 */
export const fontFamily = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
} as const;

/**
 * Font weight map (matches Figma style names → CSS values).
 */
export const fontWeight = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

/**
 * Type scale.  All values are in pixels.
 *
 * Line-height notation: a number like 1.2 means 120%, 1.45 means 145%.
 * Letter-spacing notation: em units derived from Figma % values.
 *   Figma -4% letter-spacing  → CSS -0.04em
 *   Figma -2% letter-spacing  → CSS -0.02em
 *   Figma  0% letter-spacing  → CSS  0em
 *   Figma 12% letter-spacing  → CSS  0.12em  (caption / overline)
 *   Figma 16% letter-spacing  → CSS  0.16em
 */
export const typeScale = {
  /** Large display text – hero headings */
  displayLarge: {
    fontSize:      56,
    lineHeight:    1.0,
    letterSpacing: '-0.04em',
  },
  /** Small display text */
  displaySmall: {
    fontSize:      48,
    lineHeight:    1.0,
    letterSpacing: '-0.04em',
  },

  // ── Headings ──────────────────────────────────────────────────────────────
  h1: { fontSize: 40, lineHeight: 1.2, letterSpacing: '-0.04em' },
  h2: { fontSize: 36, lineHeight: 1.2, letterSpacing: '-0.04em' },
  h3: { fontSize: 32, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h4: { fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h5: { fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h6: { fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em' },

  // ── Body / Paragraph ──────────────────────────────────────────────────────
  /** 18 px body text */
  paragraphLarge: {
    fontSize:      18,
    lineHeight:    1.45,
    letterSpacing: '0em',
  },
  /** 16 px body text (default) */
  paragraphMedium: {
    fontSize:      16,
    lineHeight:    1.45,
    letterSpacing: '0em',
  },
  /** 14 px body text */
  paragraphSmall: {
    fontSize:      14,
    lineHeight:    1.45,
    letterSpacing: '0em',
  },
  /** 12 px body text */
  paragraphXSmall: {
    fontSize:      12,
    lineHeight:    1.45,
    letterSpacing: '0em',
  },

  // ── Captions / Overlines ──────────────────────────────────────────────────
  captionLarge: {
    fontSize:      14,
    lineHeight:    1.2,
    letterSpacing: '0.12em',
    fontWeight:    fontWeight.semibold,
  },
  captionSmall: {
    fontSize:      12,
    lineHeight:    1.2,
    letterSpacing: '0.12em',
    fontWeight:    fontWeight.semibold,
  },
  captionXSmall: {
    fontSize:      10,
    lineHeight:    1.2,
    letterSpacing: '0.16em',
    fontWeight:    fontWeight.semibold,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5. SHADOWS / EFFECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Elevation shadows — use the CSS string directly in box-shadow.
 *
 * Shadow/Soft is a single-layer softer shadow.
 * Shadow/Normal uses dual layers for realistic depth.
 * Focus rings are used for keyboard-accessible interactive elements.
 */
export const shadows = {
  /** Micro lift — cards, inputs at rest */
  softXXSmall: '0 1.5px 4px -1px rgba(16,25,40,0.07)',

  /** xsmall normal elevation */
  xsmall: [
    '0 5px 3px -2px rgba(0,0,0,0.02)',
    '0 3px 2px -2px rgba(0,0,0,0.06)',
  ].join(', '),

  /** small elevation — dropdown menus, tooltips */
  small: [
    '0 2px 4px -2px rgba(0,0,0,0.04)',
    '0 4px 8px -2px rgba(0,0,0,0.08)',
  ].join(', '),

  /** medium elevation — modals, popovers */
  medium: [
    '0 4px 6px -2px rgba(0,0,0,0.06)',
    '0 12px 16px -4px rgba(0,0,0,0.10)',
  ].join(', '),

  /** large elevation — drawers */
  large: [
    '0 8px 8px -4px rgba(0,0,0,0.04)',
    '0 20px 24px -4px rgba(0,0,0,0.10)',
  ].join(', '),

  /** xlarge elevation — full-screen overlays */
  xlarge: [
    '0 8px 10px -6px rgba(16,24,40,0.10)',
    '0 20px 25px -5px rgba(16,24,40,0.10)',
  ].join(', '),

  /** xxlarge elevation */
  xxlarge: [
    '0 12px 16px -6px rgba(16,24,40,0.10)',
    '0 24px 48px -12px rgba(16,24,40,0.18)',
  ].join(', '),

  // ── Focus / interactive rings ──────────────────────────────────────────────
  /** Keyboard focus ring — blue */
  focus: '0 0 0 4px #3069fe, 0 0 0 2px #ffffff',

  /** Hover ring — neutral */
  focusHover: [
    '0 0 0 4px rgba(209,207,207,1)',
    '0 1px 2px 0 rgba(16,24,40,0.06)',
    '0 1px 3px 0 rgba(16,24,40,0.10)',
  ].join(', '),

  /** Error / warning line ring */
  focusLine: '0 0 0 4px #fbf1f1',

  /** White outline 2px (avatar stacking) */
  outlineWhite2px: '0 0 0 2px #ffffff',

  // ── Dark surface shadows (higher contrast for dark cards) ─────────────────
  /** Floating card on dark background — medium lift */
  darkCardMedium: [
    '0 4px 6px -2px rgba(0,0,0,0.06)',
    '0 12px 16px -4px rgba(0,0,0,0.10)',
  ].join(', '),

  /** Nav featured card inside dark sidebar */
  darkNavCard: [
    '0 4px 6px -2px rgba(0,0,0,0.06)',
    '0 12px 16px -4px rgba(0,0,0,0.10)',
  ].join(', '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. GLASSMORPHISM / BLUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Blur tokens for glassmorphism / frosted-glass UI patterns.
 *
 * The Figma dashboard achieves glass-like depth via:
 *   a) A SOFT_LIGHT blended dark layer (darkSurface.texture) — captured above.
 *   b) Optional CSS backdrop-filter blur for genuine frosted glass.
 *
 * Usage (CSS):
 *   background: rgba(35,35,35,0.72);
 *   backdrop-filter: blur(var(--blur-sm));
 *   -webkit-backdrop-filter: blur(var(--blur-sm));
 */
export const blur = {
  /** Subtle blur — nav bars, top headers */
  sm: '8px',

  /** Standard blur — cards, modals on dark bg */
  md: '16px',

  /** Heavy blur — full overlay panels */
  lg: '32px',

  /** Extreme blur — sidebar frosted glass variant */
  xl: '48px',
} as const;

/**
 * Glassmorphism presets — ready-to-use backdrop-filter combos.
 * Pair with a semi-transparent `background` color.
 */
export const glass = {
  /**
   * Dark glass — used on balance card and dark feature cards.
   * background: rgba(35, 35, 35, 0.72) + SOFT_LIGHT texture overlay.
   */
  dark: {
    background:     'rgba(35, 35, 35, 0.72)',
    backdropFilter: `blur(${blur.md})`,
    border:         '1px solid rgba(255, 255, 255, 0.08)',
  },

  /**
   * Light glass — frosted card on light backgrounds.
   */
  light: {
    background:     'rgba(255, 255, 255, 0.64)',
    backdropFilter: `blur(${blur.sm})`,
    border:         '1px solid rgba(255, 255, 255, 0.72)',
  },

  /**
   * Sidebar nav glass — for floating nav panels on dark sidebar.
   */
  sidebar: {
    background:     'rgba(29, 39, 57, 0.90)', // grey-800 @90%
    backdropFilter: `blur(${blur.sm})`,
    border:         '1px solid rgba(255, 255, 255, 0.06)',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7. SPACING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 4px base grid.
 * Keys are multiples: spacing[1] = 4px, spacing[2] = 8px, etc.
 */
export const spacing = {
  0:  '0px',
  0.5: '2px',
  1:  '4px',
  1.5: '6px',
  2:  '8px',
  2.5: '10px',
  3:  '12px',
  3.5: '14px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  7:  '28px',
  8:  '32px',
  9:  '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 8. BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Border radius scale.
 * Dashboard-specific radii (from Figma template analysis):
 *  - card:   10px  → use `lg`  for standard cards / table cells
 *  - panel:  24px  → use `3xl` for content panels / nested containers
 *  - screen: 28px  → use `4xl` for top-level screen frames (page clip)
 */
export const borderRadius = {
  none:   '0px',
  xs:     '2px',
  sm:     '4px',
  md:     '6px',
  lg:     '8px',
  card:   '10px',  // dashboard card corners (Figma: balance card, stat cards)
  xl:     '12px',
  '2xl':  '16px',
  '3xl':  '24px',  // content panel (Figma: inner canvas frame)
  '4xl':  '28px',  // page-level screen frame clip (Figma: Solar/Fintech)
  full:   '9999px',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 9. COMPONENT INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete list of components available in Rayna UI v1.0.
 * Organised by atomic level.
 */
export const componentInventory = {
  foundations: [
    'Colors',
    'Typography',
    'Icons',
    'Shadows & Blurs',
    'Spacing & Grids',
  ],

  atoms: [
    'Avatars',
    'Badges',
    'Buttons',
    'Button Groups',
    'Chips',
    'Empty States',
    'Inputs',
    'Loading & Progress Indicators',
    'Tabs',
  ],

  applicationComponents: [
    'Activity Feed',
    'Alerts & Notification',
    'Breadcrumbs',
    'Calendar & Date Selectors',
    'Charts',
    'Code Snippets',
    'Dividers',
    'Dropdowns',
    'File Upload',
    'Footers',
    'Form Controls',
    'Headers',
    'Messaging',
    'Media',
    'Metrics',
    'Navigation',
    'Pagination',
    'Sidebars',
    'Stepper',
    'Tables',
    'Tooltip',
  ],

  templates: [
    'Authentication',
    'Telehealth',
    'Ecommerce',
    'Marketing',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Convenience re-exports
// ─────────────────────────────────────────────────────────────────────────────

const tokens = {
  colors,
  darkSurface,
  gradients,
  fontFamily,
  fontWeight,
  typeScale,
  shadows,
  blur,
  glass,
  spacing,
  borderRadius,
  componentInventory,
} as const;

export default tokens;
