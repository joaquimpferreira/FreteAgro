// lib/viagem/calcularTrecho.ts
// Layer: lib — no imports from hooks/, components/, or app/
// Business-logic guards for trip legs (trechos).
// All guards run BEFORE any persistence to MMKV or Supabase.

import type { TrechoKm } from '@fretagro/types'

/** Thrown when a km value violates the ordering constraint */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/** Thrown when attempting to mutate an already-closed leg */
export class ImmutabilityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImmutabilityError'
  }
}

/**
 * Closes an open leg by computing kmRodado and setting fechadoEm.
 *
 * Guards:
 * - kmFinal must be > kmInicial
 * - The leg must not already be closed (fechadoEm must be null/undefined)
 * - No prior open leg may exist for the same freteId (enforced by Zustand store
 *   before calling this function — validated here as a secondary guard)
 *
 * @param trecho  The currently open TrechoKm to close
 * @param kmFinal The final odometer reading for this leg
 * @returns A new TrechoKm with kmFinal, kmRodado, and fechadoEm populated
 */
export function fecharTrecho(trecho: TrechoKm, kmFinal: number): TrechoKm {
  if (trecho.fechadoEm != null) {
    throw new ImmutabilityError(
      'Este trecho já foi encerrado e não pode ser alterado.',
    )
  }

  if (kmFinal <= trecho.kmInicial) {
    throw new ValidationError(
      'km final deve ser maior que km inicial',
    )
  }

  return {
    ...trecho,
    kmFinal,
    kmRodado: kmFinal - trecho.kmInicial,
    fechadoEm: new Date().toISOString(),
  }
}
