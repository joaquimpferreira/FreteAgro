/**
 * lib/sync/syncQueue.ts
 * Layer: lib — no imports from hooks/, components/, or app/
 * Drains the offline sync queue to Supabase.
 *
 * Conflict resolution strategy (M-III requirement):
 *
 * CREATE operations (CREATE_VIAGEM, CREATE_TRECHO, CREATE_ABASTECIMENTO, CREATE_LANCAMENTO)
 *   → Supabase upsert with ignoreDuplicates: true (ON CONFLICT (id) DO NOTHING)
 *   → Idempotent: safe to retry after partial failures or proxy/network interruptions.
 *
 * UPDATE operations (CLOSE_TRECHO, CLOSE_VIAGEM)
 *   → Supabase UPDATE WHERE id = …
 *   → Last-write wins: only the mobile client writes these fields (kmFinal, fechadoEm,
 *     status, dataFim). A second write of the same values is effectively a no-op.
 *
 * Dead-letter queue: operations failing ≥ 3 times are moved to the 'sync_dead_letter'
 *   MMKV key to prevent silent data loss. Inspect via debug menu or support tooling.
 *
 * Network resilience: each operation error (including proxy-related SSL/timeout errors)
 *   increments tentativas and is retried on the next drain() call. The Supabase client
 *   uses the OS certificate store; corporate proxy certificates must be trusted at the
 *   OS level — no code-level bypass is needed or provided.
 */

import { MMKV } from 'react-native-mmkv'
import { peek, replaceAll, type OperacaoPendente } from '../storage/queueStorage'
import { syncViagemOp } from './syncViagem'
import { syncDespesasOp } from './syncDespesas'

// ─────────────────────────────────────────────────────────────────────────────
// Dead-letter queue — stores operations that have failed ≥ 3 times
// ─────────────────────────────────────────────────────────────────────────────
const deadStorage = new MMKV({ id: 'sync_dead_letter' })
const DEAD_KEY = 'sync_dead_letter'

function readDeadLetter(): OperacaoPendente[] {
  const raw = deadStorage.getString(DEAD_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as OperacaoPendente[]
  } catch {
    return []
  }
}

function appendDeadLetter(op: OperacaoPendente): void {
  const dead = readDeadLetter()
  dead.push(op)
  deadStorage.set(DEAD_KEY, JSON.stringify(dead))
}

// ─────────────────────────────────────────────────────────────────────────────
// Routing — dispatch each op to the correct sync module
// ─────────────────────────────────────────────────────────────────────────────
const VIAGEM_TIPOS = new Set([
  'CREATE_VIAGEM',
  'CREATE_TRECHO',
  'CLOSE_TRECHO',
  'CLOSE_VIAGEM',
] as const)

const DESPESAS_TIPOS = new Set([
  'CREATE_ABASTECIMENTO',
  'CREATE_LANCAMENTO',
] as const)

async function executeOp(op: OperacaoPendente): Promise<void> {
  if (VIAGEM_TIPOS.has(op.tipo as typeof VIAGEM_TIPOS extends Set<infer T> ? T : never)) {
    await syncViagemOp(op)
  } else if (DESPESAS_TIPOS.has(op.tipo as typeof DESPESAS_TIPOS extends Set<infer T> ? T : never)) {
    await syncDespesasOp(op)
  }
  // Unknown tipos are silently skipped for forward compatibility
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drains all pending operations from the queue in FIFO order.
 *
 * - Successful operations are removed from the queue.
 * - Failed operations have tentativas incremented and are re-queued.
 * - Operations that fail 3 or more times are moved to the dead-letter queue.
 *
 * This function is safe to call concurrently — callers must guard externally
 * (see useSyncStatus in hooks/useSync.ts).
 */
export async function drain(): Promise<void> {
  const ops = peek()
  if (ops.length === 0) return

  const remaining: OperacaoPendente[] = []

  for (const op of ops) {
    try {
      await executeOp(op)
      // Success — op is removed (not added to remaining)
    } catch {
      const incremented: OperacaoPendente = {
        ...op,
        tentativas: op.tentativas + 1,
        updatedAt: new Date().toISOString(),
      }

      if (incremented.tentativas >= 3) {
        // Move to dead-letter to prevent silent data loss
        appendDeadLetter(incremented)
      } else {
        remaining.push(incremented)
      }
    }
  }

  replaceAll(remaining)
}

/**
 * Returns the number of operations currently pending in the sync queue.
 * Reads synchronously from MMKV — safe to call from any context.
 */
export function getPendingCount(): number {
  return peek().length
}
