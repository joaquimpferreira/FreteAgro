// app/api/acertos/stats/route.ts — Settlement analytics for the current filter selection
// GET /api/acertos/stats — accepts the same query params as GET /api/acertos
// (status, motoristaId) but returns aggregates over ALL matching rows, not just
// the current page.

import { requireFrotaId } from '@/lib/api/tenant'
import { ok } from '@/lib/api/errors'
import { buildAcertosWhere } from '@/lib/acertos/filters'
import { getAcertosStats } from '@/lib/acertos/aggregates'

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const url = new URL(req.url)
  const where = buildAcertosWhere(frotaId, url.searchParams)

  const stats = await getAcertosStats(where)
  return ok(stats)
}
