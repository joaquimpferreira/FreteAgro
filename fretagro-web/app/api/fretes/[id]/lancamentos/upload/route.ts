// app/api/fretes/[id]/lancamentos/upload/route.ts — Nota fiscal photo upload endpoint
// POST /api/fretes/[id]/lancamentos/upload — multipart/form-data, returns { url }
// FR-017 · lib/storage/uploadNotaFiscal.ts handles MIME validation + upload

import { requireFrotaId } from '@/lib/api/tenant'
import { notFound, ok, validationError } from '@/lib/api/errors'
import { uploadNotaFiscal } from '@/lib/storage/uploadNotaFiscal'
import { prisma } from '@/lib/db/prisma'

interface RouteContext {
  params: { id: string }
}

export async function POST(req: Request, { params }: RouteContext) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  // Verify freight belongs to tenant
  const frete = await prisma.frete.findFirst({
    where: { id: params.id, frotaId },
    select: { id: true },
  })
  if (!frete) return notFound('Frete')

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return validationError({ _root: 'Corpo da requisição deve ser multipart/form-data.' })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return validationError({ file: ['Campo "file" é obrigatório e deve ser um arquivo.'] })
  }

  const result = await uploadNotaFiscal(file, frotaId, params.id)

  if (!result.ok) {
    const status = result.error.code === 'INVALID_MIME' || result.error.code === 'FILE_TOO_LARGE'
      ? 422
      : 500
    return new Response(
      JSON.stringify({ error: result.error.code, message: result.error.message }),
      { status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return ok({ url: result.data.url, path: result.data.path })
}
