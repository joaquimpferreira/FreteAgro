// app/api/caminhoes/[id]/stats/route.ts — Per-truck analytics
// GET /api/caminhoes/[id]/stats — km rodado, consumo médio, receita, despesas, abastecimentos

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { notFound, ok } from '@/lib/api/errors'
import { getCaminhaoStats } from '@/lib/fleet/aggregates'

interface RouteContext {
  params: { id: string }
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const caminhao = await prisma.caminhao.findFirst({
    where: { id: params.id, frotaId },
    select: { id: true },
  })
  if (!caminhao) return notFound('Caminhão')

  const stats = await getCaminhaoStats(params.id, frotaId)
  return ok(stats)
}
