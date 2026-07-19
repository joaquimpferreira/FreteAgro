// app/api/motoristas/[id]/convite/route.ts — Re-send WhatsApp login reminder
// POST /api/motoristas/[id]/convite — FR-006
// Notifies the driver via WhatsApp with their login e-mail.

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { badRequest, notFound, ok } from '@/lib/api/errors'
import { sendDriverCredentials } from '@/lib/notifications/whatsapp'

interface RouteContext {
  params: { id: string }
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  const motorista = await prisma.motorista.findFirst({
    where: { id: params.id, frotaId },
  })
  if (!motorista) return notFound('Motorista')

  if (!motorista.email) {
    return badRequest('NO_CREDENTIALS', 'Este motorista ainda não possui credenciais de acesso cadastradas.')
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'o aplicativo FreteAgro'
  const result = await sendDriverCredentials(motorista.whatsapp, motorista.nome, motorista.email, appUrl)

  return ok({ sent: result.success, ...(result.error && { error: result.error }) })
}
