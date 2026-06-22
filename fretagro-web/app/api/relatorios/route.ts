// app/api/relatorios/route.ts — Financial report export handler
// GET /api/relatorios?formato=pdf|excel&from=YYYY-MM-DD&to=YYYY-MM-DD
// US6 — FR-036, SC-009 · contracts/relatorios.md
// Owner-only; scoped to caller's frotaId.
// Generates PDF or Excel and returns as file download.

import { requireFrotaId } from '@/lib/api/tenant'
import { forbidden, internalError, validationError } from '@/lib/api/errors'
import { getRelatorioData } from '@/lib/dashboard/aggregates'
import { gerarRelatorioExcel } from '@/lib/excel/gerarRelatorio'
import { gerarRelatorioPdf } from '@/lib/pdf/gerarRelatorio'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role } = context

  // Reports are owner-only (FR-036)
  if (role !== 'dono') {
    return forbidden('Apenas o dono da frota pode exportar relatórios.')
  }

  const url     = new URL(req.url)
  const formato = url.searchParams.get('formato')
  const from    = url.searchParams.get('from')
  const to      = url.searchParams.get('to')

  // ── Validate params ────────────────────────────────────────────────────────
  if (!formato || !['pdf', 'excel'].includes(formato)) {
    return validationError({ formato: 'Deve ser "pdf" ou "excel".' })
  }
  if (!from || !to) {
    return validationError({ from: 'Obrigatório.', to: 'Obrigatório.' })
  }
  // Basic date format check
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRe.test(from) || !dateRe.test(to)) {
    return validationError({ from: 'Use o formato YYYY-MM-DD.', to: 'Use o formato YYYY-MM-DD.' })
  }

  try {
    // Fetch fleet name for report header
    const frota = await prisma.frota.findUnique({
      where:  { id: frotaId },
      select: { nome: true },
    })

    const data = await getRelatorioData({
      frotaId,
      frotaNome: frota?.nome ?? 'Frota',
      from:      new Date(`${from}T00:00:00.000Z`),
      to:        new Date(`${to}T23:59:59.999Z`),
    })

    if (formato === 'excel') {
      const buffer = gerarRelatorioExcel(data)
      const filename = `relatorio-${from}-${to}.xlsx`
      return new NextResponse(buffer.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length':      String(buffer.length),
        },
      })
    }

    // PDF
    const buffer = gerarRelatorioPdf(data)
    const filename = `relatorio-${from}-${to}.pdf`
    return new NextResponse(buffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(buffer.length),
      },
    })
  } catch (err) {
    console.error('[GET /api/relatorios]', err)
    return internalError()
  }
}
