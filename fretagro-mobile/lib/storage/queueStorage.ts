// lib/storage/queueStorage.ts
// Layer: lib — no imports from hooks/, components/, or app/
// MMKV-backed offline sync queue.
// Operations are appended locally and drained by lib/sync/syncQueue.ts when online.

import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({ id: 'sync_queue' })
const QUEUE_KEY = 'sync_queue'

/** All supported operation types for the offline sync queue */
export type OperacaoTipo =
  | 'CREATE_VIAGEM'
  | 'CREATE_TRECHO'
  | 'CLOSE_TRECHO'
  | 'CREATE_ABASTECIMENTO'
  | 'CREATE_LANCAMENTO'
  | 'CLOSE_VIAGEM'

/** A single pending operation in the offline sync queue */
export interface OperacaoPendente {
  /** Client-generated cuid — used for idempotent ON CONFLICT DO NOTHING inserts */
  id: string
  tipo: OperacaoTipo
  payload: Record<string, unknown>
  /** ISO 8601 datetime of last enqueue or retry */
  updatedAt: string
  /** Number of failed sync attempts; dead-lettered after ≥ 3 */
  tentativas: number
}

function readQueue(): OperacaoPendente[] {
  const raw = storage.getString(QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as OperacaoPendente[]
  } catch {
    return []
  }
}

function writeQueue(queue: OperacaoPendente[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(queue))
}

/** Appends an operation to the end of the queue (FIFO). */
export function enqueue(op: OperacaoPendente): void {
  const queue = readQueue()
  queue.push(op)
  writeQueue(queue)
}

/** Returns and removes all operations from the queue. */
export function dequeueAll(): OperacaoPendente[] {
  const queue = readQueue()
  writeQueue([])
  return queue
}

/** Returns all operations without removing them. */
export function peek(): OperacaoPendente[] {
  return readQueue()
}

/** Replaces the entire queue contents atomically (used by syncQueue after retries). */
export function replaceAll(ops: OperacaoPendente[]): void {
  writeQueue(ops)
}
