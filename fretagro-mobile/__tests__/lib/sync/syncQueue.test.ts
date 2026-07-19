// __tests__/lib/sync/syncQueue.test.ts
// T062 — Unit tests for lib/sync/syncQueue.ts
// Dependencies are mocked so no real Supabase calls or MMKV native module is needed.

jest.mock('react-native-mmkv')
jest.mock('../../../lib/storage/queueStorage')
// Explicit factories prevent jest from loading the real modules, which would
// trigger the Supabase client import and fail with "supabaseUrl is required".
jest.mock('../../../lib/sync/syncViagem', () => ({
  syncViagemOp: jest.fn(),
}))
jest.mock('../../../lib/sync/syncDespesas', () => ({
  syncDespesasOp: jest.fn(),
}))

import { __clearAllMMKVStores } from 'react-native-mmkv'
import { drain, getPendingCount } from '../../../lib/sync/syncQueue'
import * as queueStorage from '../../../lib/storage/queueStorage'
import * as syncViagem from '../../../lib/sync/syncViagem'
import * as syncDespesas from '../../../lib/sync/syncDespesas'
import type { OperacaoPendente } from '../../../lib/storage/queueStorage'

const mockPeek = jest.mocked(queueStorage.peek)
const mockReplaceAll = jest.mocked(queueStorage.replaceAll)
const mockSyncViagemOp = jest.mocked(syncViagem.syncViagemOp)
const mockSyncDespesasOp = jest.mocked(syncDespesas.syncDespesasOp)

function makeOp(overrides: Partial<OperacaoPendente> = {}): OperacaoPendente {
  return {
    id: `op-${Math.random().toString(36).slice(2)}`,
    tipo: 'CREATE_VIAGEM',
    payload: {},
    updatedAt: '2024-01-01T00:00:00.000Z',
    tentativas: 0,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  __clearAllMMKVStores()
  mockPeek.mockReturnValue([])
  mockReplaceAll.mockImplementation(() => {})
  mockSyncViagemOp.mockResolvedValue(undefined)
  mockSyncDespesasOp.mockResolvedValue(undefined)
})

// ─── drain ────────────────────────────────────────────────────────────────────

describe('drain', () => {
  it('does nothing when the queue is empty', async () => {
    mockPeek.mockReturnValue([])
    await drain()
    expect(mockSyncViagemOp).not.toHaveBeenCalled()
    expect(mockReplaceAll).not.toHaveBeenCalled()
  })

  it('processes CREATE_VIAGEM operations via syncViagemOp', async () => {
    const op = makeOp({ tipo: 'CREATE_VIAGEM' })
    mockPeek.mockReturnValue([op])

    await drain()

    expect(mockSyncViagemOp).toHaveBeenCalledWith(op)
    expect(mockReplaceAll).toHaveBeenCalledWith([]) // nothing remaining
  })

  it('processes CREATE_ABASTECIMENTO operations via syncDespesasOp', async () => {
    const op = makeOp({ tipo: 'CREATE_ABASTECIMENTO' })
    mockPeek.mockReturnValue([op])

    await drain()

    expect(mockSyncDespesasOp).toHaveBeenCalledWith(op)
    expect(mockReplaceAll).toHaveBeenCalledWith([])
  })

  it('processes operations in FIFO order', async () => {
    const callOrder: string[] = []
    mockSyncViagemOp.mockImplementation(async (op) => {
      callOrder.push(op.id)
    })

    const op1 = makeOp({ id: 'op-first', tipo: 'CREATE_VIAGEM' })
    const op2 = makeOp({ id: 'op-second', tipo: 'CREATE_VIAGEM' })
    const op3 = makeOp({ id: 'op-third', tipo: 'CREATE_VIAGEM' })
    mockPeek.mockReturnValue([op1, op2, op3])

    await drain()

    expect(callOrder).toEqual(['op-first', 'op-second', 'op-third'])
  })

  it('increments tentativas when an operation fails', async () => {
    const op = makeOp({ id: 'failing-op', tentativas: 0 })
    mockPeek.mockReturnValue([op])
    mockSyncViagemOp.mockRejectedValue(new Error('network error'))

    await drain()

    expect(mockReplaceAll).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'failing-op', tentativas: 1 }),
    ])
  })

  it('moves operation to dead-letter queue when tentativas reaches 3', async () => {
    // tentativas=2 → failure → tentativas becomes 3 → dead-lettered
    const op = makeOp({ id: 'dying-op', tentativas: 2 })
    mockPeek.mockReturnValue([op])
    mockSyncViagemOp.mockRejectedValue(new Error('persistent error'))

    await drain()

    // The op must NOT appear in the remaining queue (it was dead-lettered)
    expect(mockReplaceAll).toHaveBeenCalledWith([])
  })

  it('keeps healthy ops and re-queues only failing ones', async () => {
    const goodOp = makeOp({ id: 'good', tipo: 'CREATE_VIAGEM', tentativas: 0 })
    const badOp = makeOp({ id: 'bad', tipo: 'CREATE_VIAGEM', tentativas: 1 })

    mockPeek.mockReturnValue([goodOp, badOp])
    mockSyncViagemOp
      .mockResolvedValueOnce(undefined) // goodOp succeeds
      .mockRejectedValueOnce(new Error('fail')) // badOp fails

    await drain()

    // Only badOp remains with tentativas incremented
    expect(mockReplaceAll).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'bad', tentativas: 2 }),
    ])
  })
})

// ─── getPendingCount ──────────────────────────────────────────────────────────

describe('getPendingCount', () => {
  it('returns the number of pending operations', () => {
    mockPeek.mockReturnValue([makeOp(), makeOp(), makeOp()])
    expect(getPendingCount()).toBe(3)
  })

  it('returns 0 when the queue is empty', () => {
    mockPeek.mockReturnValue([])
    expect(getPendingCount()).toBe(0)
  })
})
