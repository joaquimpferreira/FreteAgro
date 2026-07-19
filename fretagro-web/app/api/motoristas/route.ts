// app/api/motoristas/route.ts — Motoristas collection handlers
// GET  /api/motoristas — list drivers (paginated, ?status)
// POST /api/motoristas — create a driver + Supabase Auth user (credentials set by owner)
// FR-010 · contracts/motoristas.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody } from '@/lib/api/validate'
import { badRequest, created, internalError, ok } from '@/lib/api/errors'
import { parsePagination, buildPaginatedResponse } from '@/lib/api/pagination'
import { motoristaCreateSchema } from '@/lib/fleet/schemas'
import { createAdminSupabaseClient } from '@/lib/db/supabase'
import { sendDriverInvite } from '@/lib/notifications/whatsapp'
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

  const supabase = createAdminSupabaseClient()

  // 1. Create Supabase Auth user with the credentials defined by the fleet owner.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:            data.email,
    password:         data.senha,
    email_confirm:    true, // no email verification needed — owner controls credentials
    user_metadata:    { nome: data.nome, frotaId },
  })

  if (authError) {
    if (authError.message?.toLowerCase().includes('already registered')) {
      return badRequest('EMAIL_IN_USE', 'Este e-mail já está em uso por outro usuário.')
    }
    return internalError(`Erro ao criar conta no serviço de autenticação: ${authError.message}`)
  }

  const supabaseUserId = authData.user.id

  // 2. Create the Motorista record in the database.
  let motorista
  try {
    motorista = await prisma.motorista.create({
      data: {
        nome:               data.nome,
        cpf:                data.cpf ?? null,
        email:              data.email,
        supabaseUserId,
        whatsapp:           data.whatsapp,
        percentualComissao: data.percentualComissao,
        tipoContrato:       data.tipoContrato ?? 'autonomo',
        frotaId,
        status:             'ativo',
        appAtivado:         true,
      },
      include: {
        caminhao: {
          select: { id: true, placa: true, modelo: true, status: true },
        },
      },
    })
  } catch (dbError) {
    // Rollback: delete the Supabase Auth user so the email can be reused.
    await supabase.auth.admin.deleteUser(supabaseUserId).catch(() => undefined)
    const msg = dbError instanceof Error ? dbError.message : 'Erro desconhecido.'
    return internalError(`Erro ao salvar motorista no banco de dados: ${msg}`)
  }

  // 3. Notify the driver via WhatsApp with their login email.
  // Non-blocking — registration succeeds even if the message fails.
  const appUrl = process.env.NEXTAUTH_URL ?? 'o aplicativo FreteAgro'
  sendDriverInvite(data.whatsapp, data.nome, data.email, appUrl).catch((err) => {
    console.error('[POST /api/motoristas] WhatsApp notification failed:', err)
  })

  return created(motorista)
}
