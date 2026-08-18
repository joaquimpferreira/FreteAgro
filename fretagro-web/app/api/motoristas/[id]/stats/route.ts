// app/api/motoristas/[id]/stats/route.ts — Per-driver analytics
// GET /api/motoristas/[id]/stats — fretes realizados, comissão total, acertos pendentes

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { notFound, ok } from '@/lib/api/errors'
import { getMotoristaStats } from '@/lib/fleet/aggregates'

interface RouteContext {
  params: { id: string }
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const motorista = await prisma.motorista.findFirst({
    where: { id: params.id, frotaId },
    select: { id: true },
  })
  if (!motorista) return notFound('Motorista')

  const stats = await getMotoristaStats(params.id, frotaId)
  return ok(stats)
}
