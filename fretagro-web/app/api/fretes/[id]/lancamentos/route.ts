// app/api/fretes/[id]/lancamentos/route.ts — Freight expense handlers
// GET  /api/fretes/[id]/lancamentos — list expenses for a freight
// POST /api/fretes/[id]/lancamentos — add an expense (JSON body; photo URL pre-uploaded)
// FR-017 · contracts/lancamentos.md
//
// Photo upload: the client first calls POST /api/fretes/[id]/lancamentos/upload
// (or uploads directly to Supabase Storage) and obtains a fotoUrl, then includes
// it in the JSON body here. This keeps the handler simple (no multipart parsing).

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { created, forbidden, notFound, ok } from '@/lib/api/errors'
import { parsePagination, buildPaginatedResponse } from '@/lib/api/pagination'
import { lancamentoCreateSchema } from '@/lib/fretes/schemas'
import { assertDriverFreteAccess } from '@/lib/auth/config'
import { checkIdempotency, extractIdempotencyKey, storeIdempotencyResult } from '@/lib/api/idempotency'

interface RouteContext {
  params: { id: string }
}

// ─── GET /api/fretes/[id]/lancamentos ────────────────────────────────────────

export async function GET(req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  // Verify freight belongs to this tenant
  const frete = await prisma.frete.findFirst({
    where: { id: params.id, frotaId },
    select: { id: true },
  })
  if (!frete) return notFound('Frete')

  const url = new URL(req.url)
  const { skip, take, page, pageSize } = parsePagination(url.searchParams)

  const [total, rows, despesasAgg] = await Promise.all([
    prisma.lancamento.count({ where: { freteId: params.id, frotaId } }),
    prisma.lancamento.findMany({
      where:   { freteId: params.id, frotaId },
      skip,
      take,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.lancamento.aggregate({
      where: { freteId: params.id, frotaId },
      _sum:  { valor: true },
    }),
  ])

  const paginated = buildPaginatedResponse(rows, total, { page, pageSize, skip, take })
  return ok({
    ...paginated,
    totalDespesas: despesasAgg._sum.valor ?? 0,
  })
}

// ─── POST /api/fretes/[id]/lancamentos ───────────────────────────────────────

export async function POST(req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role, motoristaId } = context

  // US7: Idempotent write support — replay cached response for duplicate sync (FR-041)
  const idemKey = extractIdempotencyKey(req)
  const cached  = checkIdempotency(idemKey)
  if (cached) return cached

  // US7: Driver may only add expenses to their own fretes
  const driverCheck = await assertDriverFreteAccess({ role, motoristaId, freteId: params.id, frotaId })
  if (driverCheck === 'FORBIDDEN') return forbidden('Acesso não autorizado para este frete.')

  // Verify freight belongs to this tenant
  const frete = await prisma.frete.findFirst({
    where: { id: params.id, frotaId },
    select: { id: true, status: true },
  })
  if (!frete) return notFound('Frete')

  const { data, error } = await validateBody(req, lancamentoCreateSchema)
  if (error) return error

  const lancamento = await prisma.lancamento.create({
    data: {
      tipo:          data.tipo,
      valor:         data.valor,
      descricao:     data.descricao ?? null,
      deducaoAcerto: data.deducaoAcerto ?? false,
      fotoUrl:       data.fotoUrl ?? null,
      freteId:       params.id,
      frotaId,
    },
  })

  storeIdempotencyResult(idemKey, 201, lancamento)
  return created(lancamento)
}
