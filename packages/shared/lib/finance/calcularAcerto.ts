// lib/finance/calcularAcerto.ts
// Layer: lib — no imports from hooks/, components/, or app/
// Single permitted rounding point for commission (constitution Principle IV).

/**
 * Computes the gross commission for a settlement.
 * Rounds at this single point; no other rounding is applied downstream.
 *
 * @param valorFrete       Freight value in centavos
 * @param percentualComissao  Driver commission percentage (e.g. 12 for 12 %)
 * @returns valorComissao in centavos (Math.round applied once)
 */
export function calcularComissao(
  valorFrete: number,
  percentualComissao: number,
): number {
  return Math.round((valorFrete * percentualComissao) / 100)
}

/**
 * Computes the net amount due to the driver.
 * MUST NOT apply additional rounding (constitution Principle IV).
 *
 * @param valorComissao   Gross commission in centavos (result of calcularComissao)
 * @param totalDeducoes   Total deductions in centavos
 * @returns saldoFinal in centavos — no rounding applied
 */
export function calcularSaldoFinal(
  valorComissao: number,
  totalDeducoes: number,
): number {
  return valorComissao - totalDeducoes
}
