// app/api/motoristas/route.ts — Motoristas collection handlers
// GET  /api/motoristas — list drivers (paginated, ?status)
// POST /api/motoristas — create a driver + dispatch WhatsApp activation invite
// FR-010, FR-006 · contracts/motoristas.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { created, ok } from '@/lib/api/errors'
import { parsePagination, buildPaginatedResponse } from '@/lib/api/pagination'
import { motoristaCreateSchema } from '@/lib/fleet/schemas'
import { sendWhatsApp } from '@/lib/notifications/whatsapp'
import type { Prisma } from '@prisma/client'

// ─── GET /api/motoristas ──────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const url = new URL(req.url)
  const { skip, take, page, pageSize } = parsePagination(url.searchParams)

  const statusParam = url.searchParams.get('status') // ativo | inativo

  const where: Prisma.MotoristaWhereInput = { frotaId }
  if (statusParam === 'ativo' || statusParam === 'inativo') {
    where.status = statusParam
  }

  const [total, rows] = await Promise.all([
    prisma.motorista.count({ where }),
    prisma.motorista.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        caminhao: {
          select: { id: true, placa: true, modelo: true, status: true },
        },
      },
    }),
  ])

  return ok(buildPaginatedResponse(rows, total, { page, pageSize, skip, take }))
}

// ─── POST /api/motoristas ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const { data, error } = await validateBody(req, motoristaCreateSchema)
  if (error) return error

  const motorista = await prisma.motorista.create({
    data: {
      nome:               data.nome,
      cpf:                data.cpf ?? null,
      whatsapp:           data.whatsapp,
      percentualComissao: data.percentualComissao,
      tipoContrato:       data.tipoContrato ?? 'autonomo',
      frotaId,
      status:             'ativo',
      appAtivado:         false,
    },
    include: {
      caminhao: {
        select: { id: true, placa: true, modelo: true, status: true },
      },
    },
  })

  // Dispatch WhatsApp activation invite (FR-006)
  // Non-blocking — registration succeeds even if the message fails to send.
  const inviteMsg = [
    `Olá ${motorista.nome}! Você foi cadastrado como motorista no FreteAgro.`,
    `Para ativar seu acesso ao aplicativo, acesse o link:`,
    `${process.env.NEXTAUTH_URL ?? ''}/ativar?token=PENDENTE&id=${motorista.id}`,
  ].join('\n')

  sendWhatsApp({ to: motorista.whatsapp, body: inviteMsg }).catch((err) => {
    console.error('[POST /api/motoristas] WhatsApp invite failed:', err)
  })

  return created(motorista)
}
