// __tests__/lib/viagem/calcularViagem.test.ts
// T060 — Unit tests for lib/viagem/calcularViagem.ts
// Tests run in Node environment; no React Native or MMKV dependencies.

import {
  kmTotalVazio,
  kmTotalCarregado,
  kmTotalViagem,
  mediaDiesel,
  mediaDieselParaTrecho,
} from '../../../lib/viagem/calcularViagem'
import type { TrechoKm, Abastecimento } from '@fretagro/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTrecho(
  overrides: Partial<TrechoKm> & { tipo: TrechoKm['tipo'] },
): TrechoKm {
  return {
    id: 'trecho-1',
    tipo: overrides.tipo,
    kmInicial: 0,
    ordem: 0,
    freteId: 'frete-1',
    frotaId: 'frota-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeAbastecimento(
  overrides: Partial<Abastecimento> & { subtipo: Abastecimento['subtipo'] },
): Abastecimento {
  return {
    id: 'abast-1',
    subtipo: overrides.subtipo,
    litros: 50,
    precoPorLitro: 6.5,
    valorTotal: 32500,
    freteId: 'frete-1',
    frotaId: 'frota-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ─── kmTotalVazio ────────────────────────────────────────────────────────────

describe('kmTotalVazio', () => {
  it('sums only closed vazio legs', () => {
    const trechos: TrechoKm[] = [
      makeTrecho({ id: 'v1', tipo: 'vazio', kmRodado: 80 }),
      makeTrecho({ id: 'v2', tipo: 'vazio', kmRodado: 120 }),
      makeTrecho({ id: 'c1', tipo: 'carregado', kmRodado: 200 }),
    ]

    expect(kmTotalVazio(trechos)).toBe(200)
  })

  it('ignores open vazio legs (kmRodado is undefined)', () => {
    const trechos: TrechoKm[] = [
      makeTrecho({ id: 'v1', tipo: 'vazio', kmRodado: 60 }),
      makeTrecho({ id: 'v2', tipo: 'vazio' }), // open — kmRodado absent
    ]

    expect(kmTotalVazio(trechos)).toBe(60)
  })

  it('returns 0 when there are no vazio legs', () => {
    const trechos: TrechoKm[] = [
      makeTrecho({ id: 'c1', tipo: 'carregado', kmRodado: 300 }),
    ]

    expect(kmTotalVazio(trechos)).toBe(0)
  })

  it('returns 0 for an empty array', () => {
    expect(kmTotalVazio([])).toBe(0)
  })
})

// ─── kmTotalCarregado ────────────────────────────────────────────────────────

describe('kmTotalCarregado', () => {
  it('sums only closed carregado legs', () => {
    const trechos: TrechoKm[] = [
      makeTrecho({ id: 'c1', tipo: 'carregado', kmRodado: 300 }),
      makeTrecho({ id: 'c2', tipo: 'carregado', kmRodado: 150 }),
      makeTrecho({ id: 'v1', tipo: 'vazio', kmRodado: 50 }),
    ]

    expect(kmTotalCarregado(trechos)).toBe(450)
  })

  it('ignores open carregado legs', () => {
    const trechos: TrechoKm[] = [
      makeTrecho({ id: 'c1', tipo: 'carregado', kmRodado: 200 }),
      makeTrecho({ id: 'c2', tipo: 'carregado' }), // open
    ]

    expect(kmTotalCarregado(trechos)).toBe(200)
  })

  it('returns 0 for an empty array', () => {
    expect(kmTotalCarregado([])).toBe(0)
  })
})

// ─── kmTotalViagem ────────────────────────────────────────────────────────────

describe('kmTotalViagem', () => {
  it('equals kmTotalVazio + kmTotalCarregado', () => {
    const trechos: TrechoKm[] = [
      makeTrecho({ id: 'v1', tipo: 'vazio', kmRodado: 80 }),
      makeTrecho({ id: 'c1', tipo: 'carregado', kmRodado: 300 }),
      makeTrecho({ id: 'v2', tipo: 'vazio', kmRodado: 60 }),
    ]

    expect(kmTotalViagem(trechos)).toBe(440) // 80 + 60 + 300
  })

  it('returns 0 for an empty array', () => {
    expect(kmTotalViagem([])).toBe(0)
  })
})

// ─── mediaDiesel ─────────────────────────────────────────────────────────────

describe('mediaDiesel', () => {
  const closedTrecho = makeTrecho({ tipo: 'vazio', kmRodado: 400 })

  it('returns kmRodado / litrosDiesel for a closed leg', () => {
    expect(mediaDiesel(closedTrecho, 50)).toBe(8) // 400 / 50
  })

  it('returns null when the leg is still open (kmRodado undefined)', () => {
    const openTrecho = makeTrecho({ tipo: 'vazio' }) // no kmRodado

    expect(mediaDiesel(openTrecho, 50)).toBeNull()
  })

  it('returns null when litrosDiesel is zero', () => {
    expect(mediaDiesel(closedTrecho, 0)).toBeNull()
  })

  it('returns null when litrosDiesel is negative', () => {
    expect(mediaDiesel(closedTrecho, -10)).toBeNull()
  })
})

// ─── mediaDieselParaTrecho ───────────────────────────────────────────────────

describe('mediaDieselParaTrecho', () => {
  const trecho = makeTrecho({ id: 'trecho-1', tipo: 'vazio', kmRodado: 400 })

  it('uses only diesel abastecimentos for the given trechoId', () => {
    const abastecimentos: Abastecimento[] = [
      makeAbastecimento({ id: 'a1', subtipo: 'diesel', litros: 40, trechoId: 'trecho-1' }),
      makeAbastecimento({ id: 'a2', subtipo: 'diesel', litros: 10, trechoId: 'trecho-1' }),
      makeAbastecimento({ id: 'a3', subtipo: 'arla', litros: 20, trechoId: 'trecho-1' }),  // arla — excluded
      makeAbastecimento({ id: 'a4', subtipo: 'diesel', litros: 30, trechoId: 'OTHER' }),  // wrong trecho — excluded
    ]

    // litrosDiesel = 40 + 10 = 50; mediaDiesel = 400 / 50 = 8
    expect(mediaDieselParaTrecho(trecho, abastecimentos)).toBe(8)
  })

  it('returns null when there are no diesel refuels for the trecho', () => {
    const abastecimentos: Abastecimento[] = [
      makeAbastecimento({ id: 'a1', subtipo: 'arla', litros: 20, trechoId: 'trecho-1' }),
    ]

    expect(mediaDieselParaTrecho(trecho, abastecimentos)).toBeNull()
  })

  it('does not compute mediaDiesel using arla subtype', () => {
    // Only arla refuels — mediaDiesel should be null (litrosDiesel = 0)
    const abastecimentos: Abastecimento[] = [
      makeAbastecimento({ id: 'a1', subtipo: 'arla', litros: 50, trechoId: 'trecho-1' }),
    ]

    expect(mediaDieselParaTrecho(trecho, abastecimentos)).toBeNull()
  })

  it('returns null for an open trecho (kmRodado undefined)', () => {
    const openTrecho = makeTrecho({ id: 'trecho-open', tipo: 'vazio' })
    const abastecimentos: Abastecimento[] = [
      makeAbastecimento({ subtipo: 'diesel', litros: 50, trechoId: 'trecho-open' }),
    ]

    expect(mediaDieselParaTrecho(openTrecho, abastecimentos)).toBeNull()
  })
})
