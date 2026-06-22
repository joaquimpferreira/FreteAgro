// lib/fleet/vincularMotorista.ts — 1-truck-1-driver binding guard
// FR-011 (Principle IV): exactly one active driver per truck.
// Defense-in-depth on top of DB @unique constraint on Caminhao.motoristaId.
// Returns an explanatory 409 DRIVER_ALREADY_BOUND if the driver is already
// linked to a different truck, before any DB write is attempted.

import { prisma } from '@/lib/db/prisma'

export interface VincularMotoristaResult {
  /** true if the bind can proceed */
  ok: boolean
  /** present when ok is false — the truck that already holds the driver */
  conflictingCaminhaoId?: string
}

/**
 * Checks whether a driver can be bound to a truck.
 *
 * Rules:
 * - If `motoristaId` is null/undefined, the operation is an unbind — always OK.
 * - If the driver is already linked to `caminhaoId` (current truck), it's a no-op — OK.
 * - If the driver is linked to a DIFFERENT truck within the same fleet, returns NOT ok.
 *
 * @param motoristaId  The driver to bind (null = unbind)
 * @param caminhaoId   The target truck
 * @param frotaId      The tenant scope (extra safety — should match existing record)
 */
export async function checkVincularMotorista(
  motoristaId: string | null | undefined,
  caminhaoId: string,
  frotaId: string,
): Promise<VincularMotoristaResult> {
  // Unbind is always allowed
  if (!motoristaId) return { ok: true }

  // Find any truck already holding this driver (within the same tenant)
  const existing = await prisma.caminhao.findFirst({
    where: {
      motoristaId,
      frotaId,
      // Exclude the current truck so an idempotent re-bind is not flagged
      NOT: { id: caminhaoId },
    },
    select: { id: true },
  })

  if (existing) {
    return { ok: false, conflictingCaminhaoId: existing.id }
  }

  return { ok: true }
}
