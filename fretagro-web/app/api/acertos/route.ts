// app/api/acertos/route.ts — Acertos collection handlers
// GET  /api/acertos — list settlements (paginated, ?motoristaId, ?status)
// POST /api/acertos — open a new settlement for a concluded freight
// FR-021, FR-026, FR-027, FR-028 · contracts/acertos.md

import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { conflict, created, notFound, ok } from '@/lib/api/errors'
import { parsePagination, buildPaginatedResponse } from '@/lib/api/pagination'
import { calcularAcerto } from '@/lib/finance/calcularAcerto'
import type { Prisma } from '@prisma/client'

const openAcertoSchema = z.object({
  freteId: z.string().min(1),
})

// ─── GET /api/acertos ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role, motoristaId: sessionMotoristaId } = context

  const url = new URL(req.url)
  const { skip, take, page, pageSize } = parsePagination(url.searchParams)

  const motoristaIdParam = url.searchParams.get('motoristaId')
  const statusParam = url.searchParams.get('status')

  const where: Prisma.AcertoWhereInput = {
    frete: { frotaId },
  }

  // Driver "me" view — FR-027: drivers see only their own settlements
  if (motoristaIdParam === 'me') {
    if (role !== 'motorista' || !sessionMotoristaId) {
      return ok({ data: [], pagination: { page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })
    }
    where.motoristaId = sessionMotoristaId
  } else if (motoristaIdParam) {
    where.motoristaId = motoristaIdParam
  }

  if (statusParam) {
    where.status = statusParam as Prisma.EnumStatusAcertoFilter
  }

  const [total, rows] = await Promise.all([
    prisma.acerto.count({ where }),
    prisma.acerto.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        motorista: { select: { id: true, nome: true, percentualComissao: true } },
        frete: {
          select: {
            id: true,
            origem: true,
            destino: true,
            tipoCarga: true,
            dataInicio: true,
            dataFim: true,
            valorBruto: true,
          },
        },
      },
    }),
  ])

  const paginated = buildPaginatedResponse(rows, total, { page, pageSize, skip, take })

  // FR-027 "Meus ganhos": include balance summary when a driver requests their own view
  if (motoristaIdParam === 'me' && role === 'motorista' && sessionMotoristaId) {
    const [confirmedAgg, pendingAgg] = await Promise.all([
      prisma.acerto.aggregate({
        where: { motoristaId: sessionMotoristaId, status: 'realizado', frete: { frotaId } },
        _sum:  { saldoFinal: true },
      }),
      prisma.acerto.aggregate({
        where: { motoristaId: sessionMotoristaId, status: 'pendente', frete: { frotaId } },
        _sum:  { saldoFinal: true },
      }),
    ])

    return ok({
      ...paginated,
      saldo: {
        // Total confirmed (realizado) earnings in centavos
        totalConfirmado: confirmedAgg._sum.saldoFinal ?? 0,
        // Pending (pendente) unsettled balance in centavos
        totalPendente:   pendingAgg._sum.saldoFinal ?? 0,
      },
    })
  }

  return ok(paginated)
}

// ─── POST /api/acertos ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const { data, error } = await validateBody(req, openAcertoSchema)
  if (error) return error

  const { freteId } = data

  // Load the freight, scoped to this tenant
  const frete = await prisma.frete.findFirst({
    where: { id: freteId, frotaId },
    include: {
      caminhao: {
        include: {
          motorista: true,
        },
      },
      lancamentos: {
        where: { deducaoAcerto: true },
        select: { id: true, tipo: true, descricao: true, valor: true },
      },
    },
  })

  if (!frete) return notFound('Frete')

  // Freight must be concluido OR acerto_pendente without an existing acerto.
  // The second case recovers freights that had their status advanced manually
  // (e.g. via a direct PATCH) before the Acerto record was created.
  if (frete.status !== 'concluido' && frete.status !== 'acerto_pendente') {
    return conflict('FREIGHT_NOT_CONCLUDED', 'O frete precisa estar concluído para abrir um acerto.')
  }

  // One settlement per freight (freteId @unique)
  const existingAcerto = await prisma.acerto.findUnique({ where: { freteId } })
  if (existingAcerto) {
    return conflict('ACERTO_ALREADY_EXISTS', 'Já existe um acerto para este frete.')
  }

  const motorista = frete.caminhao?.motorista
  if (!motorista) {
    return conflict('CONFLICT', 'O caminhão deste frete não possui motorista vinculado.')
  }

  // Compute settlement — snapshot percentualComissao at this point in time
  const deducoes = frete.lancamentos.map((l) => ({
    id: l.id,
    tipo: l.tipo,
    descricao: l.descricao,
    valor: l.valor,
  }))

  const calculado = calcularAcerto({
    valorFrete: frete.valorBruto,
    percentualComissao: motorista.percentualComissao,
    deducoes,
  })

  // Persist the settlement + advance freight to acerto_pendente
  const [acerto] = await prisma.$transaction([
    prisma.acerto.create({
      data: {
        freteId,
        motoristaId: motorista.id,
        valorFrete: calculado.valorFrete,
        percentualComissao: calculado.percentualComissao,
        valorComissao: calculado.valorComissao,
        totalDeducoes: calculado.totalDeducoes,
        saldoFinal: calculado.saldoFinal,
        status: 'pendente',
      },
      include: {
        motorista: { select: { id: true, nome: true } },
        frete: { select: { id: true, origem: true, destino: true, status: true } },
      },
    }),
    prisma.frete.update({
      where: { id: freteId },
      data: { status: 'acerto_pendente' },
    }),
  ])

  return created({
    ...acerto,
    deducoes,
  })
}
