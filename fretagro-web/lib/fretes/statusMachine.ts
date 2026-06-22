// lib/fretes/statusMachine.ts — Freight status transition guard
// FR-018: state machine enforces the allowed transitions.
// State machine: em_andamento → concluido → acerto_pendente → acerto_realizado
// All other transitions are rejected with a 409 INVALID_STATUS_TRANSITION.

import type { StatusFrete } from '@/types/frete'

// Allowed forward transitions (acerto transitions are done by the acerto service)
const ALLOWED_TRANSITIONS: Record<StatusFrete, StatusFrete[]> = {
  em_andamento:     ['concluido'],
  concluido:        ['acerto_pendente'],
  acerto_pendente:  ['acerto_realizado'],
  acerto_realizado: [], // terminal state — no further transitions
}

export interface TransitionResult {
  ok: boolean
  /** Present when ok is false — describes the violation */
  reason?: string
}

/**
 * Validates a proposed status transition.
 *
 * @param current   The current freight status
 * @param proposed  The target status requested by the caller
 * @returns { ok: true } if the transition is allowed; { ok: false, reason } otherwise
 */
export function validateStatusTransition(
  current: StatusFrete,
  proposed: StatusFrete,
): TransitionResult {
  // No-op — not a change
  if (current === proposed) return { ok: true }

  const allowed = ALLOWED_TRANSITIONS[current] ?? []
  if (allowed.includes(proposed)) {
    return { ok: true }
  }

  return {
    ok: false,
    reason: `Transição de status inválida: "${current}" → "${proposed}". Transições permitidas: ${
      allowed.length > 0 ? allowed.join(', ') : 'nenhuma (estado terminal)'
    }.`,
  }
}
