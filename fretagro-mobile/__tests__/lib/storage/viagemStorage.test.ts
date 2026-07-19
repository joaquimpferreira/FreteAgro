// __tests__/lib/storage/viagemStorage.test.ts
// T064 — Unit tests for lib/storage/viagemStorage.ts
// MMKV is replaced by the manual mock in fretagro-mobile/__mocks__/react-native-mmkv.ts

jest.mock('react-native-mmkv')

import { __clearAllMMKVStores } from 'react-native-mmkv'
import { saveViagem, loadViagem } from '../../../lib/storage/viagemStorage'
import type { ViagemAtiva } from '@fretagro/types'

function makeViagem(overrides: Partial<ViagemAtiva> = {}): ViagemAtiva {
  return {
    freteId: 'frete-test-1',
    origem: 'Ribeirão Preto',
    destino: 'Uberlândia',
    trechos: [],
    trechoAtualIndex: 0,
    despesas: [],
    abastecimentos: [],
    pendenteSincronizacao: false,
    ...overrides,
  }
}

beforeEach(() => {
  __clearAllMMKVStores()
})

// ─── saveViagem ───────────────────────────────────────────────────────────────

describe('saveViagem', () => {
  it('serializes ViagemAtiva to JSON and persists it', () => {
    const viagem = makeViagem()
    saveViagem(viagem)

    const loaded = loadViagem()
    expect(loaded).toEqual(viagem)
  })

  it('persists all fields including nested objects', () => {
    const viagem = makeViagem({
      pendenteSincronizacao: true,
      ultimaSincronizacao: '2024-06-15T10:00:00.000Z',
    })
    saveViagem(viagem)

    const loaded = loadViagem()
    expect(loaded?.pendenteSincronizacao).toBe(true)
    expect(loaded?.ultimaSincronizacao).toBe('2024-06-15T10:00:00.000Z')
  })

  it('clears the stored trip when called with null', () => {
    saveViagem(makeViagem())
    saveViagem(null)

    expect(loadViagem()).toBeNull()
  })

  it('overwrites the previous viagem when called again', () => {
    saveViagem(makeViagem({ freteId: 'old-frete' }))
    saveViagem(makeViagem({ freteId: 'new-frete' }))

    expect(loadViagem()?.freteId).toBe('new-frete')
  })
})

// ─── loadViagem ───────────────────────────────────────────────────────────────

describe('loadViagem', () => {
  it('returns null when no trip is stored', () => {
    expect(loadViagem()).toBeNull()
  })

  it('deserializes and returns the stored ViagemAtiva', () => {
    const viagem = makeViagem({ freteId: 'frete-load-test' })
    saveViagem(viagem)

    const result = loadViagem()
    expect(result).not.toBeNull()
    expect(result?.freteId).toBe('frete-load-test')
  })

  it('returns null when stored value cannot be parsed as JSON', () => {
    // Directly corrupt the MMKV store by bypassing saveViagem
    // (simulate data corruption scenario)
    const { MMKV } = jest.requireMock('react-native-mmkv') as { MMKV: any }
    const storage = new MMKV({ id: 'viagem_ativa' })
    storage.set('viagem_ativa', 'not-valid-json{{{}')

    expect(loadViagem()).toBeNull()
  })
})
