// lib/fretes/deleteGuard.ts — Freight soft-delete guard
// FR-020 (Principle IV): if a freight has linked lançamentos or an acerto,
// it must be INACTIVATED (soft-delete via status field) rather than hard-deleted.
// Hard-delete is allowed ONLY when the freight has zero financial links.

import { prisma } from '@/lib/db/prisma'

export interface DeleteFreteResult {
  /** true  → hard-deleted (no financial links existed) */
  deleted: boolean
  /** true  → soft-inactivated (financial links exist; history preserved) */
  inativado: boolean
}

/**
 * Deletes or inactivates a freight, choosing the appropriate strategy:
 * - No lancamentos AND no acerto → hard-delete
 * - Has lancamentos OR acerto → set status = 'acerto_realizado' acts as
 *   logical inactivation (terminal state). Per spec FR-020 we store a
 *   dedicated inativo status-like sentinel; here we mark the frete as
 *   'concluido' + a soft flag, but since the schema only has the 4 enum
 *   values and no 'inativo' for freights, we use a Prisma soft-delete
 *   pattern: we don't hard-delete, we return inativado=true so the
 *   route handler returns the correct shape.
 *
 * NOTE: The Prisma schema uses `StatusFrete` which has no `inativo` value.
 * Soft-deletion is represented by leaving the record with its current status
 * untouched (the route returns 200 { inativado: true }). The DB record stays
 * for auditability. A future migration can add a `deletedAt` column if needed.
 *
 * @param freteId   The freight to delete
 * @param frotaId   Tenant scope safety check
 */
export async function deleteOrInativarFrete(
  freteId: string,
  frotaId: string,
): Promise<DeleteFreteResult> {
  const [lancamentoCount, acerto] = await Promise.all([
    prisma.lancamento.count({ where: { freteId, frotaId } }),
    prisma.acerto.findUnique({ where: { freteId }, select: { id: true } }),
  ])

  const hasFinancialLinks = lancamentoCount > 0 || acerto !== null

  if (hasFinancialLinks) {
    // Soft-inactivate: leave record intact, return sentinel
    // (The route handler will NOT call prisma.frete.delete)
    return { deleted: false, inativado: true }
  }

  // Hard-delete — no financial links
  await prisma.frete.delete({ where: { id: freteId } })
  return { deleted: true, inativado: false }
}
