// __tests__/hooks/useAcerto.test.ts
// T067 — Unit tests for hooks/useAcerto.ts
// Supabase client is fully mocked — no real network calls.
//
// Netscope proxy note: these tests make zero real HTTP requests,
// so corporate proxy configuration has no effect on test execution.

import { renderHook, act } from '@testing-library/react-native'

// ─── Mock Supabase client ────────────────────────────────────────────────────
jest.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: jest.fn(),
  },
}))

import { useAcerto } from '../../hooks/useAcerto'
import { supabase } from '../../lib/supabase/client'
import type { Acerto } from '@fretagro/types'

const mockGetSession = jest.mocked(supabase.auth.getSession)
const mockFrom = supabase.from as jest.Mock

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAcerto(overrides: Partial<Acerto> = {}): Acerto {
  return {
    id: `acerto-${Math.random().toString(36).slice(2)}`,
    valorFrete: 500000,
    percentualComissao: 12,
    valorComissao: 60000,
    totalDeducoes: 10000,
    saldoFinal: 50000,
    status: 'pendente',
    freteId: 'frete-1',
    motoristaId: 'motorista-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeFrete(overrides: Partial<{ id: string; origem: string; destino: string; dataFim: string; valorBruto: number; lancamentos: Array<{ valor: number; deducaoAcerto: boolean }> }> = {}) {
  return {
    id: `frete-${Math.random().toString(36).slice(2)}`,
    origem: 'Cidade A',
    destino: 'Cidade B',
    dataFim: '2024-01-10T00:00:00.000Z',
    valorBruto: 500000,
    lancamentos: [] as Array<{ valor: number; deducaoAcerto: boolean }>,
    ...overrides,
  }
}

function setupSupabaseMock(acertos: Acerto[], concludedFretes: ReturnType<typeof makeFrete>[] = [], percentualComissao = 10) {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: 'auth-user-1' } } },
    error: null,
  } as any)

  mockFrom.mockImplementation((table: string) => {
    if (table === 'motoristas') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'motorista-1', percentualComissao },
          error: null,
        }),
      }
    }

    if (table === 'fretes') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: concludedFretes, error: null }),
      }
    }

    // acertos query
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: acertos, error: null }),
    }
  })
}

/** Variant where the fretes (awaiting) query fails — pending acertos must still load. */
function setupSupabaseMockFretesError(acertos: Acerto[]) {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: 'auth-user-1' } } },
    error: null,
  } as any)

  mockFrom.mockImplementation((table: string) => {
    if (table === 'motoristas') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'motorista-1', percentualComissao: 10 },
          error: null,
        }),
      }
    }

    if (table === 'fretes') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'RLS blocked' } }),
      }
    }

    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: acertos, error: null }),
    }
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── pendingBalance ───────────────────────────────────────────────────────────

describe('useAcerto — pendingBalance', () => {
  it('sums valorComissao of all status=pendente acertos', async () => {
    const acertos = [
      makeAcerto({ status: 'pendente', valorComissao: 60000 }),
      makeAcerto({ status: 'pendente', valorComissao: 40000 }),
      makeAcerto({ status: 'realizado', valorComissao: 55000 }), // excluded
    ]
    setupSupabaseMock(acertos)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingBalance.valorComissao).toBe(100000)
  })

  it('sums totalDeducoes and saldoFinal for pendente acertos', async () => {
    const acertos = [
      makeAcerto({ status: 'pendente', totalDeducoes: 10000, saldoFinal: 50000 }),
      makeAcerto({ status: 'pendente', totalDeducoes: 5000, saldoFinal: 35000 }),
    ]
    setupSupabaseMock(acertos)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingBalance.totalDeducoes).toBe(15000)
    expect(result.current.pendingBalance.saldoFinal).toBe(85000)
  })

  it('returns zero balance when there are no pendente acertos', async () => {
    setupSupabaseMock([
      makeAcerto({ status: 'realizado' }),
    ])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingBalance.valorComissao).toBe(0)
    expect(result.current.pendingBalance.totalDeducoes).toBe(0)
    expect(result.current.pendingBalance.saldoFinal).toBe(0)
  })
})

// ─── pendingAcertos ───────────────────────────────────────────────────────────

describe('useAcerto — pendingAcertos', () => {
  it('contains all status=pendente acertos as individual items', async () => {
    const p1 = makeAcerto({ id: 'p1', status: 'pendente' })
    const p2 = makeAcerto({ id: 'p2', status: 'pendente' })
    const r1 = makeAcerto({ id: 'r1', status: 'realizado' })
    setupSupabaseMock([p1, p2, r1])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingAcertos).toHaveLength(2)
    expect(result.current.pendingAcertos.map((a) => a.id)).toEqual(['p1', 'p2'])
  })

  it('returns empty pendingAcertos when all acertos are realizado', async () => {
    setupSupabaseMock([
      makeAcerto({ status: 'realizado' }),
      makeAcerto({ status: 'realizado' }),
    ])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingAcertos).toHaveLength(0)
  })
})

// ─── awaitingAcertos ──────────────────────────────────────────────────────────

describe('useAcerto — awaitingAcertos', () => {
  it('calculates saldoEstimado from valorBruto and percentualComissao', async () => {
    // 10% of 500000 = 50000, no deductions
    const f1 = makeFrete({ id: 'f1', valorBruto: 500000 })
    setupSupabaseMock([], [f1], 10)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.awaitingAcertos).toHaveLength(1)
    expect(result.current.awaitingAcertos[0].comissaoBruta).toBe(50000)
    expect(result.current.awaitingAcertos[0].deducoesEstimadas).toBe(0)
    expect(result.current.awaitingAcertos[0].saldoEstimado).toBe(50000)
  })

  it('deducts lancamentos with deducaoAcerto=true from saldoEstimado', async () => {
    const f1 = makeFrete({
      id: 'f1',
      valorBruto: 500000,
      lancamentos: [
        { valor: 8000, deducaoAcerto: true },
        { valor: 5000, deducaoAcerto: false }, // should not be deducted
        { valor: 2000, deducaoAcerto: true },
      ],
    })
    setupSupabaseMock([], [f1], 10)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    const aw = result.current.awaitingAcertos[0]
    expect(aw.deducoesEstimadas).toBe(10000) // 8000 + 2000
    expect(aw.comissaoBruta).toBe(50000)     // 10% of 500000
    expect(aw.saldoEstimado).toBe(40000)     // 50000 - 10000
  })

  it('includes awaitingAcertos totals in pendingBalance', async () => {
    const f1 = makeFrete({ valorBruto: 500000 }) // 10% = 50000
    const f2 = makeFrete({ valorBruto: 300000 }) // 10% = 30000
    setupSupabaseMock([], [f1, f2], 10)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingBalance.valorComissao).toBe(80000)
    expect(result.current.pendingBalance.saldoFinal).toBe(80000)
  })

  it('accumulates pendente acertos + awaiting fretes in pendingBalance', async () => {
    // pendente acerto: saldoFinal=50000, valorComissao=60000, totalDeducoes=10000
    const acerto = makeAcerto({ status: 'pendente', valorComissao: 60000, totalDeducoes: 10000, saldoFinal: 50000 })
    // awaiting frete: 10% of 200000 = 20000
    const frete = makeFrete({ valorBruto: 200000 })
    setupSupabaseMock([acerto], [frete], 10)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.pendingBalance.valorComissao).toBe(60000 + 20000)
    expect(result.current.pendingBalance.totalDeducoes).toBe(10000 + 0)
    expect(result.current.pendingBalance.saldoFinal).toBe(50000 + 20000)
  })

  it('returns empty awaitingAcertos when no concluded fretes exist', async () => {
    setupSupabaseMock([makeAcerto({ status: 'pendente' })], [])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.awaitingAcertos).toHaveLength(0)
  })

  it('still loads pending acertos when the awaiting-fretes query fails', async () => {
    // Regression guard: a failing fretes query must NOT hide pending acertos.
    const acerto = makeAcerto({ status: 'pendente', valorComissao: 70000, saldoFinal: 70000 })
    setupSupabaseMockFretesError([acerto])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.error).toBeNull()
    expect(result.current.pendingAcertos).toHaveLength(1)
    expect(result.current.pendingBalance.saldoFinal).toBe(70000)
    expect(result.current.awaitingAcertos).toHaveLength(0)
  })
})

// ─── acertoHistory ────────────────────────────────────────────────────────────

describe('useAcerto — acertoHistory', () => {
  it('contains only settled (realizado) acertos', async () => {
    const realizado1 = makeAcerto({ id: 'r1', status: 'realizado' })
    const realizado2 = makeAcerto({ id: 'r2', status: 'realizado' })
    const pendente = makeAcerto({ id: 'p1', status: 'pendente' })
    setupSupabaseMock([realizado1, realizado2, pendente])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.acertoHistory).toHaveLength(2)
    expect(result.current.acertoHistory.map((a) => a.id)).toEqual(['r1', 'r2'])
  })

  it('returns an empty history when all acertos are pendente', async () => {
    setupSupabaseMock([
      makeAcerto({ status: 'pendente' }),
      makeAcerto({ status: 'pendente' }),
    ])

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.acertoHistory).toHaveLength(0)
  })
})

// ─── loading / no session ────────────────────────────────────────────────────

describe('useAcerto — session handling', () => {
  it('sets loading: false and returns empty state when session is absent', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)

    const { result } = renderHook(() => useAcerto())
    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.awaitingAcertos).toHaveLength(0)
    expect(result.current.pendingAcertos).toHaveLength(0)
    expect(result.current.acertoHistory).toHaveLength(0)
  })
})
