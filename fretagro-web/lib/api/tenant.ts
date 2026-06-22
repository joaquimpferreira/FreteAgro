// lib/api/tenant.ts — multi-tenant frotaId scoping guard (Principle VI / SC-008)
// Every Route Handler that reads/writes fleet-scoped data MUST call
// requireFrotaId() to extract the tenant from the session before querying.
// Defense-in-depth on top of RLS — ensures frotaId is ALWAYS applied in code.

import { auth } from '@/lib/auth/config'
import { unauthorized } from './errors'

export interface TenantContext {
  frotaId: string
  userId: string
  role: string
  motoristaId?: string
}

/**
 * Extracts and validates the frotaId tenant from the current session.
 * Returns { context } on success or { response } (401/403) on failure.
 * Route Handlers should destructure and early-return the response if present.
 *
 * @example
 * const { context, response } = await requireFrotaId()
 * if (response) return response
 * const { frotaId } = context!
 */
export async function requireFrotaId(): Promise<
  { context: TenantContext; response: null } | { context: null; response: ReturnType<typeof unauthorized> }
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth() as any
  if (!session?.user) {
    return { context: null, response: unauthorized() }
  }

  const frotaId = session.user.frotaId as string | undefined
  if (!frotaId) {
    return { context: null, response: unauthorized('Frota não encontrada na sessão.') }
  }

  // Next-Auth v5: id comes from token.id (explicitly set) or token.sub (default)
  const userId = (session.user.id ?? session.user.sub) as string

  return {
    context: {
      frotaId,
      userId,
      role:        session.user.role   as string,
      motoristaId: session.user.motoristaId as string | undefined,
    },
    response: null,
  }
}
