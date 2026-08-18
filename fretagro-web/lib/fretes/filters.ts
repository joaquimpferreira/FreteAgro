// lib/fretes/filters.ts — shared Prisma where-clause builder for frete filters
// Used by both GET /api/fretes (paginated list) and GET /api/fretes/stats (aggregates)
// so the two endpoints always agree on what "the current filter" matches.

import type { Prisma } from '@prisma/client'

export function buildFretesWhere(frotaId: string, searchParams: URLSearchParams): Prisma.FreteWhereInput {
  const statusParam      = searchParams.get('status')
  const motoristaIdParam = searchParams.get('motoristaId')
  const caminhaoIdParam  = searchParams.get('caminhaoId')
  const fromParam        = searchParams.get('from')
  const toParam          = searchParams.get('to')
  const rotaParam        = searchParams.get('rota')

  const where: Prisma.FreteWhereInput = { frotaId }

  if (statusParam) where.status = statusParam as Prisma.EnumStatusFreteFilter
  if (caminhaoIdParam) where.caminhaoId = caminhaoIdParam

  // Filter by driver via their bound truck
  if (motoristaIdParam) {
    where.caminhao = { motoristaId: motoristaIdParam }
  }

  if (fromParam || toParam) {
    where.dataInicio = {}
    if (fromParam) where.dataInicio.gte = new Date(fromParam)
    if (toParam)   where.dataInicio.lte = new Date(toParam)
  }

  if (rotaParam) {
    where.OR = [
      { origem:  { contains: rotaParam, mode: 'insensitive' } },
      { destino: { contains: rotaParam, mode: 'insensitive' } },
    ]
  }

  return where
}
