// packages/shared/__tests__/calcularAcerto.test.ts
// T061 — Unit tests for lib/finance/calcularAcerto.ts
// Tests run in Node environment (ts-jest, no React Native).

import {
  calcularComissao,
  calcularSaldoFinal,
} from '../lib/finance/calcularAcerto'

// ─── calcularComissao ────────────────────────────────────────────────────────

describe('calcularComissao', () => {
  it('computes valorComissao = Math.round(valorFrete × percentualComissao / 100)', () => {
    // R$ 10,000.00 = 1,000,000 centavos; 12% → 120,000 centavos = R$ 1,200.00
    expect(calcularComissao(1000000, 12)).toBe(120000)
    // R$ 500.00 = 50,000 centavos; 10% → 5,000 centavos = R$ 50.00
    expect(calcularComissao(50000, 10)).toBe(5000)
  })

  it('applies Math.round for fractional centavos', () => {
    // 100001 * 12 / 100 = 12000.12 → rounds to 12000
    expect(calcularComissao(100001, 12)).toBe(12000)
    // 100050 * 12 / 100 = 12006.0 → 12006
    expect(calcularComissao(100050, 12)).toBe(12006)
    // 100084 * 12 / 100 = 12010.08 → rounds to 12010
    expect(calcularComissao(100084, 12)).toBe(12010)
    // 100085 * 12 / 100 = 12010.2 → rounds to 12010
    expect(calcularComissao(100042, 12)).toBe(12005)
  })

  it('returns 0 when commission rate is zero', () => {
    expect(calcularComissao(1000000, 0)).toBe(0)
    expect(calcularComissao(0, 12)).toBe(0)
  })

  it('handles large values without integer overflow', () => {
    // R$ 100,000.00 = 10,000,000 centavos; 12% = 1,200,000 centavos
    expect(calcularComissao(10000000, 12)).toBe(1200000)
    // R$ 500,000.00 = 50,000,000 centavos; 15% = 7,500,000 centavos
    expect(calcularComissao(50000000, 15)).toBe(7500000)
  })
})

// ─── calcularSaldoFinal ──────────────────────────────────────────────────────

describe('calcularSaldoFinal', () => {
  it('computes saldoFinal = valorComissao − totalDeducoes', () => {
    expect(calcularSaldoFinal(120000, 30000)).toBe(90000)
    expect(calcularSaldoFinal(500000, 0)).toBe(500000)
  })

  it('applies NO additional rounding (constitution Principle IV)', () => {
    // Both inputs are already integer centavos; subtraction yields an exact integer
    expect(calcularSaldoFinal(120001, 30000)).toBe(90001)
    expect(calcularSaldoFinal(120000, 30001)).toBe(89999)
  })

  it('returns zero when commission equals deductions', () => {
    expect(calcularSaldoFinal(50000, 50000)).toBe(0)
  })

  it('returns negative value when deductions exceed commission', () => {
    // Valid edge case — caller is responsible for interpreting negative balance
    expect(calcularSaldoFinal(10000, 15000)).toBe(-5000)
  })

  it('handles zero deductions', () => {
    expect(calcularSaldoFinal(200000, 0)).toBe(200000)
  })
})
