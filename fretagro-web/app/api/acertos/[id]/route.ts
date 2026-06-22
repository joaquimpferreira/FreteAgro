// app/api/acertos/[id]/route.ts — Acerto item handlers
// GET   /api/acertos/[id] — get settlement detail
// PATCH /api/acertos/[id] — confirm payment (status → realizado)
// FR-023, FR-024 · contracts/acertos.md

import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { conflict, notFound, ok } from '@/lib/api/errors'

const confirmAcertoSchema = z.object({
  status: z.literal('realizado'),
})

// ─── GET /api/acertos/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const acerto = await prisma.acerto.findFirst({
    where: {
      id: params.id,
      frete: { frotaId },
    },
    include: {
      motorista: { select: { id: true, nome: true, percentualComissao: true, whatsapp: true } },
      frete: {
        select: {
          id: true,
          origem: true,
          destino: true,
          tipoCarga: true,
          dataInicio: true,
          dataFim: true,
          valorBruto: true,
          status: true,
          lancamentos: {
            where: { deducaoAcerto: true },
            select: { id: true, tipo: true, descricao: true, valor: true },
          },
        },
      },
    },
  })

  if (!acerto) return notFound('Acerto')

  return ok(acerto)
}

// ─── PATCH /api/acertos/[id] ──────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const { data: _data, error } = await validateBody(req, confirmAcertoSchema)
  if (error) return error

  // Load the settlement scoped to this tenant
  const acerto = await prisma.acerto.findFirst({
    where: {
      id: params.id,
      frete: { frotaId },
    },
    select: { id: true, status: true, freteId: true },
  })

  if (!acerto) return notFound('Acerto')

  // Concurrency guard — second-device confirm rejected (Edge Case)
  if (acerto.status === 'realizado') {
    return conflict('ACERTO_ALREADY_REALIZADO', 'Este acerto já foi confirmado.')
  }

  // Confirm: set status realizado + realizadoEm + advance freight to acerto_realizado
  const [updated] = await prisma.$transaction([
    prisma.acerto.update({
      where: { id: acerto.id },
      data: {
        status: 'realizado',
        realizadoEm: new Date(),
      },
      include: {
        motorista: { select: { id: true, nome: true } },
        frete: { select: { id: true, origem: true, destino: true, status: true } },
      },
    }),
    prisma.frete.update({
      where: { id: acerto.freteId },
      data: { status: 'acerto_realizado' },
    }),
  ])

  return ok(updated)
}
