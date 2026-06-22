// app/api/caminhoes/[id]/route.ts — Caminhão item handlers
// GET    /api/caminhoes/[id] — get one truck
// PATCH  /api/caminhoes/[id] — edit fields or bind/unbind driver
// DELETE /api/caminhoes/[id] — soft-inactivate (preserves history)
// FR-012, FR-013 · 1-truck-1-driver guard (FR-011) · contracts/caminhoes.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { conflict, notFound, ok } from '@/lib/api/errors'
import { caminhaoUpdateSchema } from '@/lib/fleet/schemas'
import { checkVincularMotorista } from '@/lib/fleet/vincularMotorista'

interface RouteContext {
  params: { id: string }
}

// ─── GET /api/caminhoes/[id] ──────────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const caminhao = await prisma.caminhao.findFirst({
    where: { id: params.id, frotaId },
    include: {
      motorista: {
        select: { id: true, nome: true, whatsapp: true, percentualComissao: true, status: true },
      },
    },
  })

  if (!caminhao) return notFound('Caminhão')
  return ok(caminhao)
}

// ─── PATCH /api/caminhoes/[id] ────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  // Verify truck belongs to this tenant
  const caminhao = await prisma.caminhao.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!caminhao) return notFound('Caminhão')

  const { data, error } = await validateBody(req, caminhaoUpdateSchema)
  if (error) return error

  // 1-truck-1-driver guard (FR-011) — only when motoristaId is being set
  if (data.motoristaId !== undefined) {
    const check = await checkVincularMotorista(data.motoristaId, params.id, frotaId)
    if (!check.ok) {
      return conflict(
        'DRIVER_ALREADY_BOUND',
        'Este motorista já está vinculado a outro caminhão. Um motorista só pode dirigir um caminhão por vez.',
      )
    }
  }

  // Normalise placa if being updated
  const placa = data.placa ? data.placa.toUpperCase().replace(/-/g, '') : undefined

  const updated = await prisma.caminhao.update({
    where: { id: params.id },
    data: {
      ...(placa      !== undefined && { placa }),
      ...(data.modelo !== undefined && { modelo: data.modelo }),
      ...(data.ano   !== undefined && { ano: data.ano }),
      ...(data.carroceria !== undefined && { carroceria: data.carroceria }),
      // motoristaId: undefined means "don't touch"; null means "unbind"
      ...(data.motoristaId !== undefined && { motoristaId: data.motoristaId }),
    },
    include: {
      motorista: {
        select: { id: true, nome: true, whatsapp: true, percentualComissao: true, status: true },
      },
    },
  })

  return ok(updated)
}

// ─── DELETE /api/caminhoes/[id] ───────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const caminhao = await prisma.caminhao.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!caminhao) return notFound('Caminhão')

  // Soft-inactivate — never hard-delete when freights may exist (FR-013)
  const updated = await prisma.caminhao.update({
    where: { id: params.id },
    data: { status: 'inativo' },
    select: { id: true, status: true },
  })

  return ok(updated)
}
