// lib/utils/chartColors.ts — Recharts color palette token file
// Recharts renders SVG and cannot use CSS custom properties / Tailwind classes
// directly in SVG attribute props (fill, stroke, tick.fill, wrapperStyle.color).
// This file is the single source of truth for all chart hex values, mapping
// them to their design-token equivalents from tailwind.config.ts / tokens.css.
//
// TOKEN MAPPING:
// CHART_AXIS_LINE     → grey-700  (#374151)
// CHART_AXIS_TICK     → grey-400  (#9ca3af)
// CHART_LEGEND_TEXT   → grey-300  (#d1d5db)
// CHART_RECEITA       → primary-400 (#16b84f — closest green)
// CHART_DESPESA       → orange-500 (#f97316)
// CHART_PALETTE       → ordered set of accent colors for donut segments
//
// ESLint: the no-restricted-syntax hex rule is intentionally suppressed here
// because this IS the token file. Hex values may only live here or in
// tailwind.config.ts / design-system/tokens.ts.
/* eslint-disable no-restricted-syntax */

/** Grid / axis line stroke (grey-700 equivalent). */
export const CHART_AXIS_LINE = '#374151'

/** Axis tick label color (grey-400 equivalent). */
export const CHART_AXIS_TICK = '#9ca3af'

/** Legend text color (grey-300 equivalent). */
export const CHART_LEGEND_TEXT = '#d1d5db'

/** Revenue bar / positive indicator color (primary-400 equivalent). */
export const CHART_RECEITA = '#22c55e'

/** Expense bar / negative indicator color (Tailwind orange-500). */
export const CHART_DESPESA = '#f97316'

/**
 * Ordered palette for categorical donut/pie segments.
 * Colours are Tailwind-500 shades providing WCAG AA contrast on dark backgrounds.
 */
export const CHART_PALETTE: readonly string[] = [
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#eab308', // yellow-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
] as const
