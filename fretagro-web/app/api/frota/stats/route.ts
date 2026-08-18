// app/api/frota/stats/route.ts — Fleet-wide analytics
// GET /api/frota/stats — caminhões/motoristas ativos, km rodado, consumo médio, ranking

import { requireFrotaId } from '@/lib/api/tenant'
import { ok } from '@/lib/api/errors'
import { getFrotaOverviewStats } from '@/lib/fleet/aggregates'

export async function GET() {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const stats = await getFrotaOverviewStats(frotaId)
  return ok(stats)
}
