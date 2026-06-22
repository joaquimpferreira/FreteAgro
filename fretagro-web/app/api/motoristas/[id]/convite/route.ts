// app/api/motoristas/[id]/convite/route.ts — Re-send WhatsApp activation invite
// POST /api/motoristas/[id]/convite — FR-006
// contracts/motoristas.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { notFound, ok } from '@/lib/api/errors'
import { sendWhatsApp } from '@/lib/notifications/whatsapp'

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

  const inviteMsg = [
    `Olá ${motorista.nome}! Você foi cadastrado como motorista no FreteAgro.`,
    `Para ativar seu acesso ao aplicativo, acesse o link:`,
    `${process.env.NEXTAUTH_URL ?? ''}/ativar?token=PENDENTE&id=${motorista.id}`,
  ].join('\n')

  const result = await sendWhatsApp({ to: motorista.whatsapp, body: inviteMsg })

  return ok({ sent: result.success, ...(result.error && { error: result.error }) })
}
