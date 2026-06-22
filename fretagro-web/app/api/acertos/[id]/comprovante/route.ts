// app/api/acertos/[id]/comprovante/route.ts — Receipt generation handler
// POST /api/acertos/[id]/comprovante — generate PDF, store in Supabase, return URL
// FR-025, SC-006 (< 10s) · contracts/acertos.md

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { conflict, internalError, notFound, ok } from '@/lib/api/errors'
import { gerarComprovante } from '@/lib/pdf/gerarComprovante'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'comprovantes'

// ─── POST /api/acertos/[id]/comprovante ───────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId } = context

  // Load the settlement with all data needed for the PDF
  const acerto = await prisma.acerto.findFirst({
    where: {
      id: params.id,
      frete: { frotaId },
    },
    include: {
      motorista: {
        select: { id: true, nome: true, whatsapp: true, percentualComissao: true },
      },
      frete: {
        select: {
          id: true,
          origem: true,
          destino: true,
          tipoCarga: true,
          dataInicio: true,
          dataFim: true,
          valorBruto: true,
          lancamentos: {
            where: { deducaoAcerto: true },
            select: { id: true, tipo: true, descricao: true, valor: true },
          },
        },
      },
    },
  })

  if (!acerto) return notFound('Acerto')

  // Only realizado settlements can get a comprovante (optional guard — open it to pending too per spec)
  if (acerto.status !== 'pendente' && acerto.status !== 'realizado') {
    return conflict('CONFLICT', 'Não é possível gerar comprovante para este acerto.')
  }

  // Generate the PDF buffer
  const pdfBuffer = gerarComprovante({
    motoristaNome: acerto.motorista.nome,
    motoristaWhatsapp: acerto.motorista.whatsapp,
    percentualComissao: acerto.percentualComissao,
    freteId: acerto.frete.id,
    origem: acerto.frete.origem,
    destino: acerto.frete.destino,
    tipoCarga: acerto.frete.tipoCarga,
    dataInicio: acerto.frete.dataInicio,
    dataFim: acerto.frete.dataFim,
    acertoId: acerto.id,
    valorFrete: acerto.valorFrete,
    valorComissao: acerto.valorComissao,
    deducoes: acerto.frete.lancamentos,
    totalDeducoes: acerto.totalDeducoes,
    saldoFinal: acerto.saldoFinal,
    createdAt: acerto.createdAt,
  })

  // Upload to Supabase Storage using service role admin client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const storagePath = `${frotaId}/${acerto.id}/comprovante.pdf`

  let { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  // Auto-create the bucket on first deploy if it doesn't exist yet
  if (uploadError?.message?.toLowerCase().includes('bucket')) {
    await supabase.storage.createBucket(BUCKET, { public: false })
    const retry = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
    uploadError = retry.error
  }

  if (uploadError) {
    console.error('[comprovante] storage upload error', uploadError)
    return internalError('Falha ao armazenar o comprovante.')
  }

  // Get a signed URL valid for 1 hour (FR-025, SC-006)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)

  if (signedError || !signedData?.signedUrl) {
    console.error('[comprovante] signed URL error', signedError)
    return internalError('Falha ao gerar URL do comprovante.')
  }

  const comprovanteUrl = signedData.signedUrl

  // Persist the URL on the acerto record
  await prisma.acerto.update({
    where: { id: acerto.id },
    data: { comprovanteUrl },
  })

  return ok({ comprovanteUrl })
}
