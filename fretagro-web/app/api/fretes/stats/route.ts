// app/api/fretes/stats/route.ts — Freight analytics for the current filter selection
// GET /api/fretes/stats — accepts the same query params as GET /api/fretes
// (status, motoristaId, caminhaoId, from, to, rota) but returns aggregates over
// ALL matching rows, not just the current page.

import { requireFrotaId } from '@/lib/api/tenant'
import { ok } from '@/lib/api/errors'
import { buildFretesWhere } from '@/lib/fretes/filters'
import { getFretesStats } from '@/lib/fretes/aggregates'

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const url = new URL(req.url)
  const where = buildFretesWhere(frotaId, url.searchParams)

  const stats = await getFretesStats(where)
  return ok(stats)
}
