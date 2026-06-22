// app/api/perfil/route.ts — User profile handlers
// GET  /api/perfil  — current user's profile + fleet data
// PATCH /api/perfil — update nome and whatsapp (email is immutable — Supabase Auth identity)
// Owner-only: drivers view read-only profile; only dono can edit fleet data.

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound } from '@/lib/api/errors'
import { z } from 'zod'
import { whatsappSchema, estadoSchema } from '@/lib/utils/validators'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const updatePerfilSchema = z.object({
  // Personal data
  nome:     z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100).optional(),
  whatsapp: whatsappSchema.optional(),
  // Fleet data — dono only; silently ignored for motoristas
  frotaNome: z.string().min(2).max(100).optional(),
  estado:    estadoSchema.optional(),
  cnpjCpf:   z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
    .refine(
      (val) => val === undefined || val === '' || val.length === 11 || val.length === 14,
      { message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.' },
    ),
})

// ─── GET /api/perfil ──────────────────────────────────────────────────────────

export async function GET() {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { userId, frotaId } = context

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      nome:      true,
      email:     true,
      whatsapp:  true,
      role:      true,
      createdAt: true,
    },
  })
  if (!user) return notFound('Usuário')

  const frota = await prisma.frota.findUnique({
    where: { id: frotaId },
    select: {
      id:        true,
      nome:      true,
      estado:    true,
      cnpjCpf:   true,
      createdAt: true,
    },
  })

  // Fleet-level stats for dono profile card
  const [totalCaminhoes, totalMotoristas, totalFretes] = await Promise.all([
    prisma.caminhao.count({ where: { frotaId, status: 'ativo' } }),
    prisma.motorista.count({ where: { frotaId, status: 'ativo' } }),
    prisma.frete.count({ where: { frotaId } }),
  ])

  return ok({
    user,
    frota,
    stats: { totalCaminhoes, totalMotoristas, totalFretes },
  })
}

// ─── PATCH /api/perfil ────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { userId, frotaId, role } = context

  const { data, error } = await validateBody(req, updatePerfilSchema)
  if (error) return error

  const { nome, whatsapp, frotaNome, estado, cnpjCpf } = data

  // Update user personal data (if provided)
  const userUpdate: Record<string, unknown> = {}
  if (nome)     userUpdate.nome     = nome
  if (whatsapp) userUpdate.whatsapp = whatsapp

  const [updatedUser] = await prisma.$transaction(async (tx) => {
    const user = Object.keys(userUpdate).length
      ? await tx.user.update({ where: { id: userId }, data: userUpdate, select: { id: true, nome: true, email: true, whatsapp: true, role: true, createdAt: true } })
      : await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, nome: true, email: true, whatsapp: true, role: true, createdAt: true } })

    // Fleet data — dono only
    let frota = null
    if (role === 'dono') {
      const frotaUpdate: Record<string, unknown> = {}
      if (frotaNome)          frotaUpdate.nome    = frotaNome
      if (estado)             frotaUpdate.estado  = estado
      if (cnpjCpf !== undefined) frotaUpdate.cnpjCpf = cnpjCpf || null

      if (Object.keys(frotaUpdate).length) {
        frota = await tx.frota.update({
          where: { id: frotaId },
          data:  frotaUpdate,
          select: { id: true, nome: true, estado: true, cnpjCpf: true, createdAt: true },
        })
      }
    }

    return [user, frota]
  })

  return ok({ user: updatedUser })
}
