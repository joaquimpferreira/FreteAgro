// app/api/fretes/[id]/route.ts — Frete item handlers
// GET    /api/fretes/[id] — get one freight with lancamentos, acerto, totalDespesas
// PATCH  /api/fretes/[id] — edit fields or advance status (with kmFinal validation)
// DELETE /api/fretes/[id] — soft-inactivate or hard-delete depending on financial links
// FR-018, FR-020 · contracts/fretes.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { conflict, forbidden, notFound, ok, validationError } from '@/lib/api/errors'
import { freteUpdateSchema } from '@/lib/fretes/schemas'
import { validateStatusTransition } from '@/lib/fretes/statusMachine'
import { deleteOrInativarFrete } from '@/lib/fretes/deleteGuard'
import { assertDriverFreteAccess } from '@/lib/auth/config'

interface RouteContext {
  params: { id: string }
}

// ─── GET /api/fretes/[id] ─────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role, motoristaId } = context

  // US7: Driver may only access their own fretes
  const driverCheck = await assertDriverFreteAccess({ role, motoristaId, freteId: params.id, frotaId })
  if (driverCheck === 'FORBIDDEN') return forbidden('Acesso não autorizado para este frete.')

  const frete = await prisma.frete.findFirst({
    where: { id: params.id, frotaId },
    include: {
      caminhao: {
        select: {
          id: true, placa: true, modelo: true,
          motorista: { select: { id: true, nome: true, percentualComissao: true } },
        },
      },
      lancamentos: { orderBy: { createdAt: 'asc' } },
      acerto:      true,
    },
  })

  if (!frete) return notFound('Frete')

  const totalDespesas = frete.lancamentos.reduce((sum, l) => sum + l.valor, 0)
  return ok({ ...frete, totalDespesas })
}

// ─── PATCH /api/fretes/[id] ───────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role, motoristaId } = context

  // US7: Driver may only update their own fretes (trip start/end)
  const driverCheck = await assertDriverFreteAccess({ role, motoristaId, freteId: params.id, frotaId })
  if (driverCheck === 'FORBIDDEN') return forbidden('Acesso não autorizado para este frete.')

  const frete = await prisma.frete.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!frete) return notFound('Frete')

  const { data, error } = await validateBody(req, freteUpdateSchema)
  if (error) return error

  // Status transition guard (FR-018)
  if (data.status && data.status !== frete.status) {
    const result = validateStatusTransition(frete.status, data.status)
    if (!result.ok) {
      return conflict('INVALID_STATUS_TRANSITION', result.reason ?? 'Transição de status inválida.')
    }
  }

  // kmFinal validation — must be >= kmInicial when setting to concluido (Edge Case)
  if (data.kmFinal !== undefined) {
    if (data.kmFinal < frete.kmInicial) {
      return validationError({ kmFinal: [`kmFinal (${data.kmFinal}) deve ser maior ou igual a kmInicial (${frete.kmInicial}).`] })
    }
  }

  const updated = await prisma.frete.update({
    where: { id: params.id },
    data: {
      ...(data.status    !== undefined && { status: data.status }),
      ...(data.kmFinal   !== undefined && { kmFinal: data.kmFinal }),
      ...(data.dataFim   !== undefined && { dataFim: new Date(data.dataFim) }),
      ...(data.origem    !== undefined && { origem: data.origem }),
      ...(data.destino   !== undefined && { destino: data.destino }),
      ...(data.tipoCarga !== undefined && { tipoCarga: data.tipoCarga }),
      ...(data.valorBruto !== undefined && { valorBruto: data.valorBruto }),
    },
    include: {
      caminhao: { select: { id: true, placa: true, modelo: true } },
    },
  })

  // Compute totalDespesas for the response
  const despesasAgg = await prisma.lancamento.aggregate({
    where:  { freteId: params.id },
    _sum:   { valor: true },
  })

  return ok({ ...updated, totalDespesas: despesasAgg._sum.valor ?? 0 })
}

// ─── DELETE /api/fretes/[id] ──────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const frete = await prisma.frete.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!frete) return notFound('Frete')

  const result = await deleteOrInativarFrete(params.id, frotaId)
  return ok({ id: params.id, ...result })
}
