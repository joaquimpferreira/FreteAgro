// app/api/motoristas/[id]/route.ts — Motorista item handlers
// GET    /api/motoristas/[id] — get one driver
// PATCH  /api/motoristas/[id] — edit driver details
// DELETE /api/motoristas/[id] — soft-inactivate (preserves history)
// FR-012, FR-013 · contracts/motoristas.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { notFound, ok } from '@/lib/api/errors'
import { motoristaUpdateSchema } from '@/lib/fleet/schemas'

interface RouteContext {
  params: { id: string }
}

// ─── GET /api/motoristas/[id] ─────────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const motorista = await prisma.motorista.findFirst({
    where: { id: params.id, frotaId },
    include: {
      caminhao: {
        select: { id: true, placa: true, modelo: true, status: true },
      },
    },
  })

  if (!motorista) return notFound('Motorista')
  return ok(motorista)
}

// ─── PATCH /api/motoristas/[id] ───────────────────────────────────────────────

export async function PATCH(req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const motorista = await prisma.motorista.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!motorista) return notFound('Motorista')

  const { data, error } = await validateBody(req, motoristaUpdateSchema)
  if (error) return error

  const updated = await prisma.motorista.update({
    where: { id: params.id },
    data: {
      ...(data.nome               !== undefined && { nome: data.nome }),
      ...(data.cpf                !== undefined && { cpf: data.cpf }),
      ...(data.whatsapp           !== undefined && { whatsapp: data.whatsapp }),
      ...(data.percentualComissao !== undefined && { percentualComissao: data.percentualComissao }),
      ...(data.tipoContrato       !== undefined && { tipoContrato: data.tipoContrato }),
    },
    include: {
      caminhao: {
        select: { id: true, placa: true, modelo: true, status: true },
      },
    },
  })

  return ok(updated)
}

// ─── DELETE /api/motoristas/[id] ──────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const motorista = await prisma.motorista.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!motorista) return notFound('Motorista')

  // Soft-inactivate — all settlement history is preserved (FR-013)
  const updated = await prisma.motorista.update({
    where: { id: params.id },
    data: { status: 'inativo' },
    select: { id: true, status: true },
  })

  return ok(updated)
}
