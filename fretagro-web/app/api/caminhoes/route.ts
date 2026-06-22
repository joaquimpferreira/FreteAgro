// app/api/caminhoes/route.ts — Caminhões collection handlers
// GET  /api/caminhoes — list trucks (paginated, ?status, ?semMotorista)
// POST /api/caminhoes — create a truck
// FR-009, FR-015 · contracts/caminhoes.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { conflict, created, ok } from '@/lib/api/errors'
import { parsePagination, buildPaginatedResponse } from '@/lib/api/pagination'
import { caminhaoCreateSchema } from '@/lib/fleet/schemas'
import type { Prisma } from '@prisma/client'

// ─── GET /api/caminhoes ───────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const url = new URL(req.url)
  const { skip, take, page, pageSize } = parsePagination(url.searchParams)

  const statusParam      = url.searchParams.get('status')   // ativo | inativo
  const semMotoristaParam = url.searchParams.get('semMotorista') // true

  // Build Prisma where clause
  const where: Prisma.CaminhaoWhereInput = { frotaId }
  if (statusParam === 'ativo' || statusParam === 'inativo') {
    where.status = statusParam
  }
  if (semMotoristaParam === 'true') {
    where.motoristaId = null
    where.status = 'ativo' // only active trucks without driver are alertable (FR-015)
  }

  const [total, rows] = await Promise.all([
    prisma.caminhao.count({ where }),
    prisma.caminhao.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        motorista: {
          select: { id: true, nome: true, whatsapp: true, percentualComissao: true, status: true },
        },
      },
    }),
  ])

  return ok(buildPaginatedResponse(rows, total, { page, pageSize, skip, take }))
}

// ─── POST /api/caminhoes ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const { data, error } = await validateBody(req, caminhaoCreateSchema)
  if (error) return error

  // Normalise placa to uppercase, strip hyphens for storage
  const placaNormalised = data.placa.toUpperCase().replace(/-/g, '')

  // Check placa uniqueness (application-level; DB @unique is the final guard)
  const existing = await prisma.caminhao.findUnique({ where: { placa: placaNormalised } })
  if (existing) {
    return conflict('PLACA_TAKEN', 'Já existe um caminhão com esta placa cadastrado.')
  }

  const caminhao = await prisma.caminhao.create({
    data: {
      placa:      placaNormalised,
      modelo:     data.modelo,
      ano:        data.ano ?? null,
      carroceria: data.carroceria ?? null,
      frotaId,
      status:     'ativo',
    },
    include: {
      motorista: {
        select: { id: true, nome: true, whatsapp: true, percentualComissao: true, status: true },
      },
    },
  })

  return created(caminhao)
}
