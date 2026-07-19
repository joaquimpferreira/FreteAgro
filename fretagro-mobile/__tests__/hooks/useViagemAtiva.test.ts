// __tests__/hooks/useViagemAtiva.test.ts
// T068 — Unit tests for hooks/useViagemAtiva.ts
// useViagemStore is mocked; the hook is purely synchronous (reads from Zustand store).

import { renderHook } from '@testing-library/react-native'

// ─── Mock Zustand store ───────────────────────────────────────────────────────
jest.mock('../../store/viagemStore', () => ({
  useViagemStore: jest.fn(),
}))

import { useViagemAtiva } from '../../hooks/useViagemAtiva'
import { useViagemStore } from '../../store/viagemStore'
import type { ViagemAtiva } from '@fretagro/types'

const mockUseViagemStore = jest.mocked(useViagemStore)

function makeViagem(overrides: Partial<ViagemAtiva> = {}): ViagemAtiva {
  return {
    freteId: 'frete-123',
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

function setupStore(viagem: ViagemAtiva | null) {
  mockUseViagemStore.mockImplementation((selector: any) =>
    selector({ viagem }),
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── isViagemAtiva ────────────────────────────────────────────────────────────

describe('useViagemAtiva — isViagemAtiva', () => {
  it('returns true when the store has an active trip', () => {
    setupStore(makeViagem())
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.isViagemAtiva).toBe(true)
  })

  it('returns false when the store has no active trip', () => {
    setupStore(null)
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.isViagemAtiva).toBe(false)
  })
})

// ─── tripRoute ────────────────────────────────────────────────────────────────

describe('useViagemAtiva — tripRoute', () => {
  it('returns "origem → destino" string when both are set', () => {
    setupStore(makeViagem({ origem: 'São Paulo', destino: 'Campinas' }))
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.tripRoute).toBe('São Paulo → Campinas')
  })

  it('returns null when there is no active trip', () => {
    setupStore(null)
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.tripRoute).toBeNull()
  })

  it('returns null when origem is missing', () => {
    setupStore(makeViagem({ origem: undefined, destino: 'Uberlândia' }))
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.tripRoute).toBeNull()
  })

  it('returns null when destino is missing', () => {
    setupStore(makeViagem({ origem: 'Ribeirão Preto', destino: undefined }))
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.tripRoute).toBeNull()
  })
})

// ─── pendenteSincronizacao ────────────────────────────────────────────────────

describe('useViagemAtiva — pendenteSincronizacao', () => {
  it('reflects the store pendenteSincronizacao flag', () => {
    setupStore(makeViagem({ pendenteSincronizacao: true }))
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.pendenteSincronizacao).toBe(true)
  })

  it('returns false when there is no active trip', () => {
    setupStore(null)
    const { result } = renderHook(() => useViagemAtiva())
    expect(result.current.pendenteSincronizacao).toBe(false)
  })
})

// ─── synchronicity — no network call ─────────────────────────────────────────

describe('useViagemAtiva — synchronous behaviour', () => {
  it('returns values immediately without any async resolution (no network call)', () => {
    setupStore(makeViagem())

    // renderHook result is immediately available — no act() or await needed
    const { result } = renderHook(() => useViagemAtiva())

    expect(result.current.isViagemAtiva).toBe(true)
    expect(result.current.viagemAtiva).not.toBeNull()
    expect(result.current.tripRoute).not.toBeNull()
  })

  it('exposes the full ViagemAtiva object as viagemAtiva', () => {
    const viagem = makeViagem({ freteId: 'frete-xyz' })
    setupStore(viagem)

    const { result } = renderHook(() => useViagemAtiva())

    expect(result.current.viagemAtiva).toEqual(viagem)
  })
})
