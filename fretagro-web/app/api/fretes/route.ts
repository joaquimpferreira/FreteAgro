// app/api/fretes/route.ts — Fretes collection handlers
// GET  /api/fretes — list freights (paginated + filters)
// POST /api/fretes — create a freight
// FR-016, FR-019 · contracts/fretes.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { created, forbidden, ok } from '@/lib/api/errors'
import { parsePagination, buildPaginatedResponse } from '@/lib/api/pagination'
import { freteCreateSchema } from '@/lib/fretes/schemas'
import { assertDriverCaminhaoAccess } from '@/lib/auth/config'
import { checkIdempotency, extractIdempotencyKey, storeIdempotencyResult } from '@/lib/api/idempotency'
import type { Prisma } from '@prisma/client'

// ─── GET /api/fretes ──────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const url = new URL(req.url)
  const { skip, take, page, pageSize } = parsePagination(url.searchParams)

  const statusParam      = url.searchParams.get('status')
  const motoristaIdParam = url.searchParams.get('motoristaId')
  const caminhaoIdParam  = url.searchParams.get('caminhaoId')
  const fromParam        = url.searchParams.get('from')
  const toParam          = url.searchParams.get('to')
  const rotaParam        = url.searchParams.get('rota')

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

  const [total, rows] = await Promise.all([
    prisma.frete.count({ where }),
    prisma.frete.findMany({
      where,
      skip,
      take,
      orderBy: { dataInicio: 'desc' },
      include: {
        caminhao: {
          select: { id: true, placa: true, modelo: true, motorista: { select: { id: true, nome: true } } },
        },
        // Include totalDespesas as sum of lancamentos
        _count: { select: { lancamentos: true } },
      },
    }),
  ])

  // Compute totalDespesas per frete (aggregation)
  const freteIds = rows.map((f) => f.id)
  const despesasSums = await prisma.lancamento.groupBy({
    by:   ['freteId'],
    _sum: { valor: true },
    where: { freteId: { in: freteIds } },
  })
  const despesasMap = new Map(
    despesasSums.map((d) => [d.freteId, d._sum.valor ?? 0]),
  )

  const data = rows.map((f) => ({
    ...f,
    totalDespesas: despesasMap.get(f.id) ?? 0,
  }))

  return ok(buildPaginatedResponse(data, total, { page, pageSize, skip, take }))
}

// ─── POST /api/fretes ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role, motoristaId } = context

  // US7: Idempotent write support — replay cached response for duplicate sync (FR-041)
  const idemKey = extractIdempotencyKey(req)
  const cached  = checkIdempotency(idemKey)
  if (cached) return cached

  const { data, error } = await validateBody(req, freteCreateSchema)
  if (error) return error

  // US7: Driver may only create fretes for the caminhão they are bound to (FR-040)
  const driverCheck = await assertDriverCaminhaoAccess({
    role, motoristaId, caminhaoId: data.caminhaoId, frotaId,
  })
  if (driverCheck === 'FORBIDDEN') {
    return forbidden('Motorista não autorizado para este caminhão.')
  }

  // Verify the truck belongs to this tenant
  const caminhao = await prisma.caminhao.findFirst({
    where: { id: data.caminhaoId, frotaId },
  })
  if (!caminhao) {
    return (await import('@/lib/api/errors')).notFound('Caminhão')
  }

  const frete = await prisma.frete.create({
    data: {
      origem:     data.origem,
      destino:    data.destino,
      tipoCarga:  data.tipoCarga,
      kmInicial:  data.kmInicial,
      valorBruto: data.valorBruto,
      dataInicio: new Date(data.dataInicio),
      status:     'em_andamento',
      frotaId,
      caminhaoId: data.caminhaoId,
    },
    include: {
      caminhao: { select: { id: true, placa: true, modelo: true } },
    },
  })

  const body = { ...frete, totalDespesas: 0 }
  storeIdempotencyResult(idemKey, 201, body)
  return created(body)
}
