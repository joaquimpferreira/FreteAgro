// __tests__/lib/viagem/calcularTrecho.test.ts
// T059 — Unit tests for lib/viagem/calcularTrecho.ts
// Tests run in Node environment; no React Native or MMKV dependencies.

import {
  fecharTrecho,
  ValidationError,
  ImmutabilityError,
} from '../../../lib/viagem/calcularTrecho'
import type { TrechoKm } from '@fretagro/types'

const openTrecho: TrechoKm = {
  id: 'trecho-abc',
  tipo: 'vazio',
  kmInicial: 100,
  ordem: 0,
  freteId: 'frete-1',
  frotaId: 'frota-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  // fechadoEm is absent — leg is open
}

describe('fecharTrecho', () => {
  it('computes kmRodado = kmFinal − kmInicial', () => {
    const result = fecharTrecho(openTrecho, 250)

    expect(result.kmRodado).toBe(150)
    expect(result.kmFinal).toBe(250)
    expect(result.kmInicial).toBe(100)
  })

  it('sets fechadoEm on the returned trecho', () => {
    const result = fecharTrecho(openTrecho, 200)

    expect(result.fechadoEm).toBeDefined()
    // Should be a valid ISO string
    expect(() => new Date(result.fechadoEm!)).not.toThrow()
  })

  it('does not mutate the original trecho', () => {
    fecharTrecho(openTrecho, 200)

    expect(openTrecho.kmFinal).toBeUndefined()
    expect(openTrecho.kmRodado).toBeUndefined()
    expect(openTrecho.fechadoEm).toBeUndefined()
  })

  it('throws ValidationError when kmFinal equals kmInicial', () => {
    expect(() => fecharTrecho(openTrecho, 100)).toThrow(ValidationError)
    expect(() => fecharTrecho(openTrecho, 100)).toThrow(
      'km final deve ser maior que km inicial',
    )
  })

  it('throws ValidationError when kmFinal is less than kmInicial', () => {
    expect(() => fecharTrecho(openTrecho, 50)).toThrow(ValidationError)
  })

  it('throws ImmutabilityError when fechadoEm is already set', () => {
    const closedTrecho: TrechoKm = {
      ...openTrecho,
      kmFinal: 200,
      kmRodado: 100,
      fechadoEm: '2024-01-01T01:00:00.000Z',
    }

    expect(() => fecharTrecho(closedTrecho, 300)).toThrow(ImmutabilityError)
    expect(() => fecharTrecho(closedTrecho, 300)).toThrow(
      'Este trecho já foi encerrado e não pode ser alterado.',
    )
  })

  it('ImmutabilityError is checked before ValidationError', () => {
    // Even if kmFinal would be invalid, the immutability guard fires first
    const closedTrecho: TrechoKm = {
      ...openTrecho,
      kmFinal: 200,
      kmRodado: 100,
      fechadoEm: '2024-01-01T01:00:00.000Z',
    }

    // kmFinal=50 would normally throw ValidationError, but closed trecho
    // must throw ImmutabilityError first (fechadoEm guard runs first in code)
    expect(() => fecharTrecho(closedTrecho, 50)).toThrow(ImmutabilityError)
  })

  it('preserves all original trecho fields on the returned object', () => {
    const result = fecharTrecho(openTrecho, 300)

    expect(result.id).toBe(openTrecho.id)
    expect(result.tipo).toBe(openTrecho.tipo)
    expect(result.ordem).toBe(openTrecho.ordem)
    expect(result.freteId).toBe(openTrecho.freteId)
    expect(result.frotaId).toBe(openTrecho.frotaId)
    expect(result.createdAt).toBe(openTrecho.createdAt)
  })
})
