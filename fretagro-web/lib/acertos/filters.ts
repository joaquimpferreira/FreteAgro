// lib/acertos/filters.ts — shared Prisma where-clause builder for acerto filters
// Used by both GET /api/acertos (paginated list) and GET /api/acertos/stats
// (aggregates) so the two endpoints always agree on what "the current filter" matches.

import type { Prisma } from '@prisma/client'

export function buildAcertosWhere(frotaId: string, searchParams: URLSearchParams): Prisma.AcertoWhereInput {
  const motoristaIdParam = searchParams.get('motoristaId')
  const statusParam = searchParams.get('status')

  const where: Prisma.AcertoWhereInput = {
    frete: { frotaId },
  }

  if (motoristaIdParam && motoristaIdParam !== 'me') {
    where.motoristaId = motoristaIdParam
  }

  if (statusParam) {
    where.status = statusParam as Prisma.EnumStatusAcertoFilter
  }

  return where
}
