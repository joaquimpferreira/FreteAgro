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

function setupSupabaseMock(acertos: Acerto[]) {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: 'motorista-1' } } },
    error: null,
  } as any)

  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: acertos, error: null }),
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
    expect(result.current.acertoHistory).toHaveLength(0)
  })
})
