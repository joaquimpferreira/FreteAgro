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
import { buildFretesWhere } from '@/lib/fretes/filters'
import { assertDriverCaminhaoAccess } from '@/lib/auth/config'
import { checkIdempotency, extractIdempotencyKey, storeIdempotencyResult } from '@/lib/api/idempotency'

// ─── GET /api/fretes ──────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const url = new URL(req.url)
  const { skip, take, page, pageSize } = parsePagination(url.searchParams)
  const where = buildFretesWhere(frotaId, url.searchParams)

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

  // Compute totalDespesas per frete — lancamentos (pátio, pedágio, etc.) plus
  // fuel purchases logged via the driver app, which reduce profit just the same.
  const freteIds = rows.map((f) => f.id)
  const [despesasSums, abastecimentosSums] = await Promise.all([
    prisma.lancamento.groupBy({
      by:   ['freteId'],
      _sum: { valor: true },
      where: { freteId: { in: freteIds } },
    }),
    prisma.abastecimento.groupBy({
      by:   ['freteId'],
      _sum: { valorTotal: true },
      where: { freteId: { in: freteIds } },
    }),
  ])
  const despesasMap = new Map(
    despesasSums.map((d) => [d.freteId, d._sum.valor ?? 0]),
  )
  const abastecimentosMap = new Map(
    abastecimentosSums.map((a) => [a.freteId, a._sum.valorTotal ?? 0]),
  )

  const data = rows.map((f) => ({
    ...f,
    totalDespesas: (despesasMap.get(f.id) ?? 0) + (abastecimentosMap.get(f.id) ?? 0),
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
