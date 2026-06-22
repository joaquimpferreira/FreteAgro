// Vitest unit tests for calcularCaixa — US5, Gate 3
// Tests: lucroLiquido = receitas − totalDespesas (FR-031), category totals + % (FR-032)

import { describe, it, expect } from 'vitest'
import { calcularCaixa, type CaixaInput } from './calcularCaixa'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeFrete = (freteId: string, valor: number, data = '2026-05-10') => ({
  freteId,
  valor,
  data,
})

const makeLancamento = (tipo: string, valor: number) => ({ tipo, valor })

const makeComissao = (valorComissao: number) => ({ valorComissao })

// ─── Basic calculation ────────────────────────────────────────────────────────

describe('calcularCaixa', () => {
  it('computes lucroLiquido = receitas − totalDespesas (FR-031)', () => {
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 5_400_000)],
      lancamentos: [makeLancamento('combustivel', 540_000)],
      comissoes:   [makeComissao(648_000)],
    }
    const result = calcularCaixa(input)

    expect(result.receitas.total).toBe(5_400_000)
    expect(result.totalDespesas).toBe(540_000 + 648_000) // 1_188_000
    expect(result.lucroLiquido).toBe(5_400_000 - 1_188_000) // 4_212_000
  })

  it('sums multiple receitas correctly', () => {
    const input: CaixaInput = {
      receitas: [
        makeFrete('f1', 1_850_000),
        makeFrete('f2', 3_550_000),
      ],
      lancamentos: [],
      comissoes:   [],
    }
    const result = calcularCaixa(input)

    expect(result.receitas.total).toBe(5_400_000)
    expect(result.receitas.itens).toHaveLength(2)
  })

  it('groups lancamentos by tipo and calculates percentuals (FR-032)', () => {
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 5_000_000)],
      lancamentos: [
        makeLancamento('combustivel', 540_000),
        makeLancamento('combustivel', 60_000),  // same type — should merge
        makeLancamento('manutencao',  200_000),
      ],
      comissoes:   [],
    }
    const result = calcularCaixa(input)

    const combustivel = result.despesasPorCategoria.find((c) => c.categoria === 'combustivel')
    const manutencao  = result.despesasPorCategoria.find((c) => c.categoria === 'manutencao')

    expect(combustivel?.total).toBe(600_000)
    expect(manutencao?.total).toBe(200_000)

    // totalDespesas = 800_000
    // combustivel % = 600_000 / 800_000 = 75.00
    // manutencao  % = 200_000 / 800_000 = 25.00
    expect(combustivel?.percentual).toBe(75)
    expect(manutencao?.percentual).toBe(25)
  })

  it('adds comissoes as a separate "comissao" category', () => {
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 2_000_000)],
      lancamentos: [makeLancamento('combustivel', 400_000)],
      comissoes:   [makeComissao(240_000), makeComissao(120_000)],
    }
    const result = calcularCaixa(input)

    const comissao = result.despesasPorCategoria.find((c) => c.categoria === 'comissao')
    expect(comissao?.total).toBe(360_000)
    expect(result.totalDespesas).toBe(760_000)
  })

  it('returns lucroLiquido as negative when despesas > receitas', () => {
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 1_000_000)],
      lancamentos: [makeLancamento('combustivel', 800_000)],
      comissoes:   [makeComissao(400_000)],
    }
    const result = calcularCaixa(input)

    expect(result.lucroLiquido).toBe(1_000_000 - 1_200_000) // -200_000
  })

  it('handles empty input gracefully (no revenue, no expenses)', () => {
    const input: CaixaInput = { receitas: [], lancamentos: [], comissoes: [] }
    const result = calcularCaixa(input)

    expect(result.receitas.total).toBe(0)
    expect(result.totalDespesas).toBe(0)
    expect(result.lucroLiquido).toBe(0)
    expect(result.despesasPorCategoria).toHaveLength(0)
  })

  it('sets percentual to 0 when totalDespesas is 0', () => {
    // Edge case: no expenses but there are comissoes = 0
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 1_000_000)],
      lancamentos: [],
      comissoes:   [],
    }
    const result = calcularCaixa(input)

    expect(result.despesasPorCategoria).toHaveLength(0)
    expect(result.lucroLiquido).toBe(1_000_000)
  })

  it('skips comissao category when totalComissoes is 0', () => {
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 1_000_000)],
      lancamentos: [makeLancamento('combustivel', 100_000)],
      comissoes:   [makeComissao(0)],
    }
    const result = calcularCaixa(input)

    // 0-value comissao should NOT create an empty category
    const comissao = result.despesasPorCategoria.find((c) => c.categoria === 'comissao')
    expect(comissao).toBeUndefined()
    expect(result.despesasPorCategoria).toHaveLength(1)
  })

  it('sorts despesasPorCategoria descending by total', () => {
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 5_000_000)],
      lancamentos: [
        makeLancamento('patio',      100_000),
        makeLancamento('combustivel', 500_000),
        makeLancamento('salario',     300_000),
      ],
      comissoes: [],
    }
    const result = calcularCaixa(input)

    const totals = result.despesasPorCategoria.map((c) => c.total)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })

  it('does not round lucroLiquido — integer arithmetic only (Principle IV)', () => {
    // Use values that would produce rounding if floats were used
    const input: CaixaInput = {
      receitas:    [makeFrete('f1', 3_333_333)],
      lancamentos: [makeLancamento('combustivel', 1_111_111)],
      comissoes:   [],
    }
    const result = calcularCaixa(input)

    expect(result.lucroLiquido).toBe(3_333_333 - 1_111_111) // 2_222_222 exactly
    expect(Number.isInteger(result.lucroLiquido)).toBe(true)
  })
})
