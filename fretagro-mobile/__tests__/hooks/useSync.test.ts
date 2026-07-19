// __tests__/hooks/useSync.test.ts
// T066 — Unit tests for hooks/useSync.ts
// All external dependencies (useConectividade, syncQueue, viagemStore) are mocked.

import { renderHook, act } from '@testing-library/react-native'

// ─── Mock declarations (hoisted before imports by babel-jest) ─────────────────
jest.mock('../../hooks/useConectividade', () => ({
  useConectividade: jest.fn(),
}))
jest.mock('../../lib/sync/syncQueue', () => ({
  drain: jest.fn(),
  getPendingCount: jest.fn(),
}))
jest.mock('../../store/viagemStore', () => ({
  useViagemStore: jest.fn(),
}))

import { useSyncStatus } from '../../hooks/useSync'
import { useConectividade } from '../../hooks/useConectividade'
import { drain, getPendingCount } from '../../lib/sync/syncQueue'
import { useViagemStore } from '../../store/viagemStore'

const mockUseConectividade = jest.mocked(useConectividade)
const mockDrain = jest.mocked(drain)
const mockGetPendingCount = jest.mocked(getPendingCount)
const mockUseViagemStore = jest.mocked(useViagemStore)

const mockMarcarSincronizado = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  mockDrain.mockResolvedValue(undefined)
  mockGetPendingCount.mockReturnValue(0)
  // Simulate Zustand selector call: (s) => s.marcarSincronizado
  mockUseViagemStore.mockImplementation((selector: any) =>
    selector({ marcarSincronizado: mockMarcarSincronizado }),
  )
  // Default: start offline
  mockUseConectividade.mockReturnValue({ isConnected: false })
})

// ─── drain trigger ────────────────────────────────────────────────────────────

describe('useSyncStatus — drain trigger', () => {
  it('calls drain when isConnected transitions from false to true', async () => {
    const { rerender } = renderHook(() => useSyncStatus())

    // Transition to online
    mockUseConectividade.mockReturnValue({ isConnected: true })

    await act(async () => {
      rerender()
    })

    expect(mockDrain).toHaveBeenCalledTimes(1)
  })

  it('does NOT call drain when already online on initial render', async () => {
    // Start online with empty queue → mount effect skips (getPendingCount returns 0)
    mockUseConectividade.mockReturnValue({ isConnected: true })
    mockGetPendingCount.mockReturnValue(0)

    renderHook(() => useSyncStatus())
    await act(async () => {})

    expect(mockDrain).not.toHaveBeenCalled()
  })

  it('calls drain on mount when already online and queue is non-empty', async () => {
    mockUseConectividade.mockReturnValue({ isConnected: true })
    mockGetPendingCount.mockReturnValue(3)

    renderHook(() => useSyncStatus())
    await act(async () => {})

    expect(mockDrain).toHaveBeenCalledTimes(1)
  })
})

// ─── marcarSincronizado ───────────────────────────────────────────────────────

describe('useSyncStatus — marcarSincronizado', () => {
  it('calls marcarSincronizado after drain completes successfully', async () => {
    const { rerender } = renderHook(() => useSyncStatus())

    mockUseConectividade.mockReturnValue({ isConnected: true })
    await act(async () => {
      rerender()
    })

    expect(mockMarcarSincronizado).toHaveBeenCalled()
  })
})

// ─── pendingCount ─────────────────────────────────────────────────────────────

describe('useSyncStatus — pendingCount', () => {
  it('exposes pendingCount from getPendingCount()', () => {
    mockGetPendingCount.mockReturnValue(5)

    const { result } = renderHook(() => useSyncStatus())

    expect(result.current.pendingCount).toBe(5)
  })

  it('reflects updated pendingCount after connectivity change', async () => {
    mockGetPendingCount.mockReturnValue(2)

    const { result, rerender } = renderHook(() => useSyncStatus())
    await act(async () => {})

    // After a drain cycle, getPendingCount returns 0
    mockGetPendingCount.mockReturnValue(0)
    mockUseConectividade.mockReturnValue({ isConnected: true })

    await act(async () => {
      rerender()
    })

    expect(result.current.pendingCount).toBe(0)
  })
})
