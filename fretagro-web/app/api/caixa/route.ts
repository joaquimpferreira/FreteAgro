// app/api/caixa/route.ts — Caixa (Cash Flow) handlers
// GET  /api/caixa  — period statement: receitas, despesasPorCategoria, lucroLiquido
// POST /api/caixa  — manual avulso outflow (Lancamento with no freteId)
// US5 — FR-029, FR-030, FR-031, FR-032 · contracts/caixa.md
// Owner-only; scoped to caller's frotaId.

import { prisma } from '@/lib/db/prisma'
import { requireFrotaId } from '@/lib/api/tenant'
import { validateBody, validateQuery } from '@/lib/api/validate'
import { created, forbidden, ok } from '@/lib/api/errors'
import { calcularCaixa } from '@/lib/finance/calcularCaixa'
import { lancamentoCaixaSchema, caixaQuerySchema } from '@/lib/caixa/schemas'

// ─── GET /api/caixa ───────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role } = context

  // Caixa is owner-only (FR-029)
  if (role !== 'dono') {
    return forbidden('Apenas o dono da frota pode acessar o fluxo de caixa.')
  }

  const url = new URL(req.url)
  const { data: query, error: queryError } = validateQuery(url.searchParams, caixaQuerySchema)
  if (queryError) return queryError

  const { from, to } = query
  const fromDate = new Date(`${from}T00:00:00.000Z`)
  const toDate   = new Date(`${to}T23:59:59.999Z`)

  // ── Fetch concluded/settled fretes in the period ──────────────────────────
  // A frete generates revenue once it is concluded (or later stages).
  // We use dataFim as the revenue recognition date when available,
  // falling back to dataInicio for freights still being processed.
  const fretes = await prisma.frete.findMany({
    where: {
      frotaId,
      status: { in: ['concluido', 'acerto_pendente', 'acerto_realizado'] },
      OR: [
        { dataFim: { gte: fromDate, lte: toDate } },
        { dataFim: null, dataInicio: { gte: fromDate, lte: toDate } },
      ],
    },
    select: {
      id:          true,
      valorBruto:  true,
      dataFim:     true,
      dataInicio:  true,
      lancamentos: {
        select: { tipo: true, valor: true },
      },
      acerto: {
        select: { valorComissao: true },
      },
    },
  })

  // ── Fetch avulso lancamentos in the period (freteId = null) ───────────────
  const lancamentosAvulsos = await prisma.lancamento.findMany({
    where: {
      frotaId,
      freteId:   null,
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: { tipo: true, valor: true },
  })

  // ── Build calcularCaixa inputs ────────────────────────────────────────────
  const receitas = fretes.map((f) => ({
    freteId: f.id,
    valor:   f.valorBruto,
    data:    (f.dataFim ?? f.dataInicio).toISOString().split('T')[0],
  }))

  // All lancamentos: from fretes + avulso
  const lancamentos = [
    ...fretes.flatMap((f) =>
      f.lancamentos.map((l) => ({ tipo: l.tipo as string, valor: l.valor })),
    ),
    ...lancamentosAvulsos.map((l) => ({ tipo: l.tipo as string, valor: l.valor })),
  ]

  const comissoes = fretes
    .filter((f) => f.acerto !== null)
    .map((f) => ({ valorComissao: f.acerto!.valorComissao }))

  const resultado = calcularCaixa({ receitas, lancamentos, comissoes })

  return ok({
    periodo: { from, to },
    receitas: resultado.receitas,
    despesasPorCategoria: resultado.despesasPorCategoria,
    totalDespesas: resultado.totalDespesas,
    lucroLiquido:  resultado.lucroLiquido,
  })
}

// ─── POST /api/caixa ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role } = context

  // Caixa write is owner-only
  if (role !== 'dono') {
    return forbidden('Apenas o dono da frota pode registrar lançamentos avulsos.')
  }

  const { data, error } = await validateBody(req, lancamentoCaixaSchema)
  if (error) return error

  const { tipo, descricao, valor, data: dataStr } = data

  const lancamento = await prisma.lancamento.create({
    data: {
      tipo,
      descricao:    descricao ?? null,
      valor,
      // Store the user-supplied date in createdAt (override default now())
      createdAt:    new Date(`${dataStr}T12:00:00.000Z`),
      deducaoAcerto: false,
      // freteId = null → avulso cash-flow entry (FR-030)
      frotaId,
    },
  })

  return created(lancamento)
}
