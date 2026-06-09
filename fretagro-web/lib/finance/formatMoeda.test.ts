// lib/finance/formatMoeda.test.ts — Quality Gate 3 unit tests
import { describe, it, expect } from 'vitest'
import { formatMoeda, reaisToCentavos } from './formatMoeda'

describe('formatMoeda', () => {
  it('formats zero correctly', () => {
    expect(formatMoeda(0)).toBe('R$\u00a00,00')
  })

  it('formats a typical freight value (R$ 1.500,00)', () => {
    expect(formatMoeda(150000)).toBe('R$\u00a01.500,00')
  })

  it('formats R$ 150,00 from 15000 centavos', () => {
    expect(formatMoeda(15000)).toBe('R$\u00a0150,00')
  })

  it('formats cents correctly (R$ 0,01)', () => {
    expect(formatMoeda(1)).toBe('R$\u00a00,01')
  })

  it('handles negative amounts (deductions)', () => {
    // Negative saldo — displayed as negative BRL
    const result = formatMoeda(-500)
    expect(result).toContain('5,00')
  })

  it('formats large values (R$ 50.000,00)', () => {
    expect(formatMoeda(5000000)).toBe('R$\u00a050.000,00')
  })

  it('handles odd cent values without floating-point drift', () => {
    // 1/3 of R$ 1,00 = 33 centavos; stored as Int, no drift
    expect(formatMoeda(33)).toBe('R$\u00a00,33')
  })
})

describe('reaisToCentavos', () => {
  it('converts R$ 150,50 to 15050 centavos', () => {
    expect(reaisToCentavos(150.5)).toBe(15050)
  })

  it('converts R$ 0,01 to 1 centavo', () => {
    expect(reaisToCentavos(0.01)).toBe(1)
  })

  it('converts integer reais (R$ 1.000,00) to 100000 centavos', () => {
    expect(reaisToCentavos(1000)).toBe(100000)
  })

  it('rounds correctly for floating-point edge cases', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — must round to 30
    expect(reaisToCentavos(0.1 + 0.2)).toBe(30)
  })
})
