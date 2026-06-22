// Vitest unit tests for calcularAcerto — Gate 3
// Uses quickstart V4 example values and edge-cent scenarios.

import { describe, it, expect } from 'vitest';
import { calcularAcerto } from './calcularAcerto';

const noDeducoes: never[] = [];

describe('calcularAcerto', () => {
  // Quickstart V4 example: valorFrete=1850000 (R$18.500), percentual=12%, deducao vale=45000
  it('quickstart V4 example — exact centavos', () => {
    const result = calcularAcerto({
      valorFrete: 1850000,
      percentualComissao: 12,
      deducoes: [{ id: 'd1', tipo: 'vale', descricao: 'Vale posto', valor: 45000 }],
    });

    expect(result.valorComissao).toBe(222000); // Math.round(1850000 * 12 / 100)
    expect(result.totalDeducoes).toBe(45000);
    expect(result.saldoFinal).toBe(177000);    // 222000 − 45000
  });

  it('no deductions — saldoFinal equals valorComissao', () => {
    const result = calcularAcerto({
      valorFrete: 1000000,
      percentualComissao: 10,
      deducoes: noDeducoes,
    });

    expect(result.valorComissao).toBe(100000);
    expect(result.totalDeducoes).toBe(0);
    expect(result.saldoFinal).toBe(100000);
  });

  it('saldoFinal can be negative (deductions exceed commission)', () => {
    const result = calcularAcerto({
      valorFrete: 500000,
      percentualComissao: 10,
      deducoes: [{ id: 'd1', tipo: 'adiantamento', descricao: null, valor: 60000 }],
    });

    expect(result.valorComissao).toBe(50000);
    expect(result.totalDeducoes).toBe(60000);
    expect(result.saldoFinal).toBe(-10000); // negative allowed
  });

  it('rounding: Math.round at commission only — 0.5 cent rounds up', () => {
    // 100001 * 10 / 100 = 10000.1 → Math.round → 10000
    const result = calcularAcerto({
      valorFrete: 100001,
      percentualComissao: 10,
      deducoes: noDeducoes,
    });

    expect(result.valorComissao).toBe(10000);
  });

  it('rounding: 100005 * 10 / 100 = 10000.5 → rounds to 10001', () => {
    const result = calcularAcerto({
      valorFrete: 100005,
      percentualComissao: 10,
      deducoes: noDeducoes,
    });

    expect(result.valorComissao).toBe(10001);
    expect(result.saldoFinal).toBe(10001);
  });

  it('saldoFinal is integer subtraction, never rounded', () => {
    // valorComissao = Math.round(1 * 3 / 10) = Math.round(0.3) = 0
    // totalDeducoes = 0
    // saldoFinal = 0 − 0 = 0
    const result = calcularAcerto({
      valorFrete: 1,
      percentualComissao: 30,
      deducoes: noDeducoes,
    });
    expect(typeof result.saldoFinal).toBe('number');
    expect(Number.isInteger(result.saldoFinal)).toBe(true);
  });

  it('multiple deductions are summed correctly', () => {
    const result = calcularAcerto({
      valorFrete: 2000000,
      percentualComissao: 15,
      deducoes: [
        { id: 'd1', tipo: 'vale', descricao: null, valor: 20000 },
        { id: 'd2', tipo: 'adiantamento', descricao: null, valor: 30000 },
        { id: 'd3', tipo: 'combustivel', descricao: null, valor: 10000 },
      ],
    });

    expect(result.valorComissao).toBe(300000); // 2000000 * 15 / 100
    expect(result.totalDeducoes).toBe(60000);  // 20000 + 30000 + 10000
    expect(result.saldoFinal).toBe(240000);
  });

  it('preserves deducoes array in output', () => {
    const deducoes = [{ id: 'd1', tipo: 'vale', descricao: 'teste', valor: 1000 }];
    const result = calcularAcerto({ valorFrete: 100000, percentualComissao: 10, deducoes });
    expect(result.deducoes).toBe(deducoes);
  });

  it('snapshots input values into output', () => {
    const result = calcularAcerto({
      valorFrete: 500000,
      percentualComissao: 8,
      deducoes: noDeducoes,
    });
    expect(result.valorFrete).toBe(500000);
    expect(result.percentualComissao).toBe(8);
  });
});
