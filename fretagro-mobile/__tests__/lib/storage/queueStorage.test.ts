// __tests__/lib/storage/queueStorage.test.ts
// T063 — Unit tests for lib/storage/queueStorage.ts
// MMKV is replaced by the manual mock in fretagro-mobile/__mocks__/react-native-mmkv.ts

jest.mock('react-native-mmkv')

import { __clearAllMMKVStores } from 'react-native-mmkv'
import {
  enqueue,
  dequeueAll,
  peek,
  replaceAll,
  type OperacaoPendente,
} from '../../../lib/storage/queueStorage'

function makeOp(overrides: Partial<OperacaoPendente> = {}): OperacaoPendente {
  return {
    id: `op-${Math.random().toString(36).slice(2)}`,
    tipo: 'CREATE_VIAGEM',
    payload: { freteId: 'frete-1' },
    updatedAt: '2024-01-01T00:00:00.000Z',
    tentativas: 0,
    ...overrides,
  }
}

beforeEach(() => {
  // Clear all in-memory MMKV stores between tests to prevent state bleed
  __clearAllMMKVStores()
})

// ─── enqueue ─────────────────────────────────────────────────────────────────

describe('enqueue', () => {
  it('adds an operation to an empty queue', () => {
    const op = makeOp({ id: 'op-1' })
    enqueue(op)

    expect(peek()).toHaveLength(1)
    expect(peek()[0].id).toBe('op-1')
  })

  it('adds operations to the end of the queue (FIFO order)', () => {
    const op1 = makeOp({ id: 'op-1' })
    const op2 = makeOp({ id: 'op-2' })
    const op3 = makeOp({ id: 'op-3' })

    enqueue(op1)
    enqueue(op2)
    enqueue(op3)

    const queue = peek()
    expect(queue[0].id).toBe('op-1')
    expect(queue[1].id).toBe('op-2')
    expect(queue[2].id).toBe('op-3')
  })

  it('preserves all fields of the enqueued operation', () => {
    const op = makeOp({
      id: 'op-full',
      tipo: 'CREATE_TRECHO',
      payload: { trechoId: 'trecho-1', kmInicial: 100 },
      tentativas: 2,
    })
    enqueue(op)

    const stored = peek()[0]
    expect(stored).toEqual(op)
  })
})

// ─── dequeueAll ──────────────────────────────────────────────────────────────

describe('dequeueAll', () => {
  it('returns all items and clears the queue', () => {
    enqueue(makeOp({ id: 'op-1' }))
    enqueue(makeOp({ id: 'op-2' }))

    const result = dequeueAll()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('op-1')
    expect(result[1].id).toBe('op-2')
    // Queue must be empty afterwards
    expect(peek()).toHaveLength(0)
  })

  it('returns empty array when queue is already empty', () => {
    expect(dequeueAll()).toEqual([])
  })

  it('clears the queue even after multiple enqueues', () => {
    for (let i = 0; i < 5; i++) enqueue(makeOp())
    dequeueAll()
    expect(peek()).toHaveLength(0)
  })
})

// ─── peek ────────────────────────────────────────────────────────────────────

describe('peek', () => {
  it('returns items without removing them', () => {
    const op = makeOp({ id: 'op-peek' })
    enqueue(op)

    const first = peek()
    const second = peek()

    expect(first).toHaveLength(1)
    expect(second).toHaveLength(1)
    expect(first[0].id).toBe('op-peek')
  })

  it('returns empty array when queue is empty', () => {
    expect(peek()).toEqual([])
  })
})

// ─── replaceAll ──────────────────────────────────────────────────────────────

describe('replaceAll', () => {
  it('replaces queue contents atomically', () => {
    enqueue(makeOp({ id: 'old-op' }))

    const newOps = [makeOp({ id: 'new-op-1' }), makeOp({ id: 'new-op-2' })]
    replaceAll(newOps)

    const queue = peek()
    expect(queue).toHaveLength(2)
    expect(queue[0].id).toBe('new-op-1')
    expect(queue[1].id).toBe('new-op-2')
  })

  it('clears the queue when called with an empty array', () => {
    enqueue(makeOp())
    enqueue(makeOp())

    replaceAll([])

    expect(peek()).toHaveLength(0)
  })

  it('preserves the order of the replacement array', () => {
    const ops = [
      makeOp({ id: 'r1', tentativas: 1 }),
      makeOp({ id: 'r2', tentativas: 2 }),
    ]
    replaceAll(ops)

    expect(peek()[0].tentativas).toBe(1)
    expect(peek()[1].tentativas).toBe(2)
  })
})
