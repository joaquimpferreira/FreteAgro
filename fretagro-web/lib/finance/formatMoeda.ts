// lib/finance/formatMoeda.ts
// Display-layer conversion: centavos (Int) → BRL string.
// This is the ONLY place where centavos are converted to reais for display.
// Principle IV / research §3: all money in the app is stored/computed as Int centavos.

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Converts an integer centavo value to a Brazilian Real display string.
 *
 * @param centavos - Integer amount in centavos (e.g. 15000 = R$ 150,00)
 * @returns Formatted BRL string (e.g. "R$ 150,00")
 *
 * @example
 * formatMoeda(150000) // "R$ 1.500,00"
 * formatMoeda(0)      // "R$ 0,00"
 * formatMoeda(-500)   // "-R$ 5,00"
 */
export function formatMoeda(centavos: number): string {
  return BRL_FORMATTER.format(centavos / 100)
}

/**
 * Converts a BRL decimal value (from user input) to integer centavos.
 * Use this only at input boundaries to convert user-entered reais to centavos.
 *
 * @param reais - Decimal real value (e.g. 150.50)
 * @returns Integer centavos (e.g. 15050)
 */
export function reaisToCentavos(reais: number): number {
  return Math.round(reais * 100)
}
