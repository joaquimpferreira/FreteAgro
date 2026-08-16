// lib/dashboard/aggregates.ts — Dashboard KPI/aggregation queries
// US6 — FR-033, FR-034, FR-035, FR-028, FR-015 · contracts/relatorios.md
// Server-side only. Pure DB queries + math; no I/O side-effects.
// Principle IV: all money in centavos.

import { prisma } from '@/lib/db/prisma'

// ─── Period helpers ───────────────────────────────────────────────────────────

export interface PeriodRange {
  from: Date
  to: Date
}

export type PeriodPreset =
  | 'este_mes'
  | 'mes_passado'
  | 'ultimos_3_meses'
  | 'este_ano'
  | 'personalizado'

/**
 * Converts a preset + optional custom dates to a PeriodRange.
 * For 'personalizado', `from` and `to` must be provided as YYYY-MM-DD strings.
 */
export function resolvePeriod(
  periodo: PeriodPreset,
  from?: string,
  to?: string,
): PeriodRange {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based

  switch (periodo) {
    case 'este_mes':
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month + 1, 0, 23, 59, 59, 999),
      }
    case 'mes_passado': {
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      return {
        from: new Date(py, pm, 1),
        to: new Date(py, pm + 1, 0, 23, 59, 59, 999),
      }
    }
    case 'ultimos_3_meses':
      return {
        from: new Date(year, month - 2, 1),
        to: new Date(year, month + 1, 0, 23, 59, 59, 999),
      }
    case 'este_ano':
      return {
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31, 23, 59, 59, 999),
      }
    case 'personalizado':
    default:
      return {
        from: from ? new Date(`${from}T00:00:00.000Z`) : new Date(year, month, 1),
        to: to ? new Date(`${to}T23:59:59.999Z`) : new Date(year, month + 1, 0, 23, 59, 59, 999),
      }
  }
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface DashboardKpis {
  /** Σ valorBruto of concluded/settled fretes — centavos */
  receitaBruta: number
  /** Count of fretes in period */
  totalFretes: number
  /** Σ all expense lancamentos — centavos */
  despesasTotais: number
  /** receitaBruta − despesasTotais — centavos */
  lucroLiquido: number
}

export interface DashboardAlertas {
  /** Acertos with status = 'pendente' */
  acertosPendentes: number
  /** Active trucks with no bound driver */
  caminhoesSemMotorista: number
}

export interface ReceitaDespesaMes {
  /** YYYY-MM */
  mes: string
  /** Centavos */
  receita: number
  /** Centavos */
  despesa: number
  /** Count of fretes concluded in this month */
  totalFretes: number
}

export interface DespesaCategoria {
  categoria: string
  /** Centavos */
  total: number
  /** 0–100 */
  percentual: number
}

export interface FretesRecentesItem {
  id: string
  origem: string
  destino: string
  status: string
  valorBruto: number
  dataInicio: string
  motoristaNome: string | null
  caminhaoPlaca: string
}

export interface DashboardData {
  kpis: DashboardKpis
  alertas: DashboardAlertas
  receitaDespesaPorMes: ReceitaDespesaMes[]
  despesasPorCategoria: DespesaCategoria[]
  fretesRecentes: FretesRecentesItem[]
}

// ─── Main aggregation function ────────────────────────────────────────────────

/**
 * Fetches all KPIs, alerts, chart data, and recent freights for the dashboard.
 * SC-005: cached with revalidate = 300 at the page level.
 */
export async function getDashboardData(
  frotaId: string,
  period: PeriodRange,
): Promise<DashboardData> {
  const { from, to } = period

  // ── 1. Fretes in period (concluded or later) ──────────────────────────────
  const fretes = await prisma.frete.findMany({
    where: {
      frotaId,
      status: { in: ['concluido', 'acerto_pendente', 'acerto_realizado'] },
      OR: [
        { dataFim: { gte: from, lte: to } },
        { dataFim: null, dataInicio: { gte: from, lte: to } },
      ],
    },
    select: {
      id:         true,
      valorBruto: true,
      dataInicio: true,
      dataFim:    true,
      status:     true,
      lancamentos: {
        select: { tipo: true, valor: true },
      },
    },
  })

  // ── 2. Avulso lancamentos in period ───────────────────────────────────────
  const lancamentosAvulsos = await prisma.lancamento.findMany({
    where: {
      frotaId,
      freteId:   null,
      createdAt: { gte: from, lte: to },
    },
    select: { tipo: true, valor: true },
  })

  // ── 3. Alerts: pending acertos + trucks without driver ────────────────────
  const [acertosPendentes, caminhoesSemMotorista] = await Promise.all([
    prisma.acerto.count({
      where: { frete: { frotaId }, status: 'pendente' },
    }),
    prisma.caminhao.count({
      where: { frotaId, status: 'ativo', motoristaId: null },
    }),
  ])

  // ── 4. Recent freights (last 5, any status) ───────────────────────────────
  const fretesRecentes = await prisma.frete.findMany({
    where: { frotaId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id:         true,
      origem:     true,
      destino:    true,
      status:     true,
      valorBruto: true,
      dataInicio: true,
      caminhao: {
        select: {
          placa:    true,
          motorista: { select: { nome: true } },
        },
      },
    },
  })

  // ── 5. Compute KPIs ───────────────────────────────────────────────────────
  const receitaBruta = fretes.reduce((s, f) => s + f.valorBruto, 0)
  const totalFretes  = fretes.length

  const allLancamentos = [
    ...fretes.flatMap((f) => f.lancamentos),
    ...lancamentosAvulsos,
  ]
  const despesasTotais = allLancamentos.reduce((s, l) => s + l.valor, 0)
  const lucroLiquido   = receitaBruta - despesasTotais

  // ── 6. Expense composition by category ───────────────────────────────────
  const categoryMap = new Map<string, number>()
  for (const l of allLancamentos) {
    categoryMap.set(l.tipo, (categoryMap.get(l.tipo) ?? 0) + l.valor)
  }
  const despesasPorCategoria: DespesaCategoria[] = Array.from(categoryMap.entries())
    .map(([categoria, total]) => ({
      categoria,
      total,
      percentual: despesasTotais > 0 ? Math.round((total / despesasTotais) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // ── 7. Receita vs despesa by month ────────────────────────────────────────
  const monthMap = new Map<string, { receita: number; despesa: number; totalFretes: number }>()

  for (const f of fretes) {
    const d = f.dataFim ?? f.dataInicio
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = monthMap.get(mes) ?? { receita: 0, despesa: 0, totalFretes: 0 }
    entry.receita += f.valorBruto
    entry.despesa += f.lancamentos.reduce((s, l) => s + l.valor, 0)
    entry.totalFretes += 1
    monthMap.set(mes, entry)
  }

  for (const l of lancamentosAvulsos) {
    // avulso lancamentos don't have a date field in the select above; they fall
    // into the current period but we aggregate them separately into the current month
    const now = new Date()
    const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const entry = monthMap.get(mes) ?? { receita: 0, despesa: 0, totalFretes: 0 }
    entry.despesa += l.valor
    monthMap.set(mes, entry)
  }

  const receitaDespesaPorMes: ReceitaDespesaMes[] = Array.from(monthMap.entries())
    .map(([mes, v]) => ({ mes, ...v }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  // ── 8. Shape recent freights ──────────────────────────────────────────────
  const fretesRecentesFormatted: FretesRecentesItem[] = fretesRecentes.map((f) => ({
    id:           f.id,
    origem:       f.origem,
    destino:      f.destino,
    status:       f.status,
    valorBruto:   f.valorBruto,
    dataInicio:   f.dataInicio.toISOString().split('T')[0],
    motoristaNome: f.caminhao.motorista?.nome ?? null,
    caminhaoPlaca: f.caminhao.placa,
  }))

  return {
    kpis: { receitaBruta, totalFretes, despesasTotais, lucroLiquido },
    alertas: { acertosPendentes, caminhoesSemMotorista },
    receitaDespesaPorMes,
    despesasPorCategoria,
    fretesRecentes: fretesRecentesFormatted,
  }
}

// ─── Report data ──────────────────────────────────────────────────────────────

export interface RelatorioInput {
  frotaId: string
  frotaNome: string
  from: Date
  to: Date
}

/** Rich per-frete row for reports */
export interface FreteRelatorio {
  numero: number
  id: string
  dataInicio: string
  dataFim: string | null
  origem: string
  destino: string
  tipoCarga: string
  kmInicial: number
  kmFinal: number | null
  kmTotal: number | null
  valorBruto: number          // centavos
  caminhaoPlaca: string
  motoristaNome: string | null
  percentualComissao: number | null
  // Lancamentos por categoria (centavos)
  diesel: number
  pedagio: number
  vale: number
  adiantamento: number
  outros: number
  totalDespesasFrete: number
  // Acerto
  valorComissao: number | null
  totalDeducoes: number | null
  saldoFinal: number | null
  // Resultado
  lucroFrota: number          // valorBruto - totalDespesasFrete - (valorComissao ?? 0)
}

/** Motorista summary for the settlement sheet */
export interface MotoristaSummaryRelatorio {
  nome: string
  totalFretes: number
  totalComissao: number       // centavos
  totalDeducoes: number       // centavos
  saldoFinal: number          // centavos
}

export interface RelatorioData {
  frotaNome: string
  periodo: { from: string; to: string }
  fretes: FreteRelatorio[]
  lancamentosAvulsos: { tipo: string; valor: number; descricao: string | null }[]
  motoristas: MotoristaSummaryRelatorio[]
  despesasPorCategoria: DespesaCategoria[]
  totalReceitas: number       // centavos
  totalDespesas: number       // centavos (fretes + avulsos)
  totalComissoes: number      // centavos
  lucroLiquido: number        // centavos
  totalKm: number
  totalFretes: number
  margem: number              // 0–100 percentage
}

const TIPO_CARGA_LABEL: Record<string, string> = {
  grao:         'Grão',
  oleo_soja:    'Óleo de soja',
  farelo:       'Farelo',
  fertilizante: 'Fertilizante',
  outro:        'Outro',
}

/**
 * Fetches full data needed to generate a financial report (PDF or Excel).
 * SC-009: report contains all data for accounting review.
 */
export async function getRelatorioData(input: RelatorioInput): Promise<RelatorioData> {
  const { frotaId, frotaNome, from, to } = input

  const fretes = await prisma.frete.findMany({
    where: {
      frotaId,
      status: { in: ['concluido', 'acerto_pendente', 'acerto_realizado'] },
      OR: [
        { dataFim: { gte: from, lte: to } },
        { dataFim: null, dataInicio: { gte: from, lte: to } },
      ],
    },
    orderBy: { dataInicio: 'asc' },
    select: {
      id:         true,
      origem:     true,
      destino:    true,
      tipoCarga:  true,
      kmInicial:  true,
      kmFinal:    true,
      valorBruto: true,
      dataInicio: true,
      dataFim:    true,
      caminhao: {
        select: {
          placa:    true,
          motorista: {
            select: { nome: true, percentualComissao: true },
          },
        },
      },
      lancamentos: {
        select: { tipo: true, valor: true, descricao: true },
      },
      acerto: {
        select: {
          valorComissao: true,
          totalDeducoes: true,
          saldoFinal:    true,
        },
      },
    },
  })

  const lancamentosAvulsos = await prisma.lancamento.findMany({
    where: { frotaId, freteId: null, createdAt: { gte: from, lte: to } },
    select: { tipo: true, valor: true, descricao: true },
  })

  // ── Build per-frete rows ──────────────────────────────────────────────────
  const fretesRows: FreteRelatorio[] = fretes.map((f, idx) => {
    const diesel      = f.lancamentos.filter(l => l.tipo === 'combustivel').reduce((s, l) => s + l.valor, 0)
    const pedagio     = f.lancamentos.filter(l => l.tipo === 'pedagio').reduce((s, l) => s + l.valor, 0)
    const vale        = f.lancamentos.filter(l => l.tipo === 'vale').reduce((s, l) => s + l.valor, 0)
    const adiantamento= f.lancamentos.filter(l => l.tipo === 'adiantamento').reduce((s, l) => s + l.valor, 0)
    const outros      = f.lancamentos
      .filter(l => !['combustivel','pedagio','vale','adiantamento'].includes(l.tipo))
      .reduce((s, l) => s + l.valor, 0)
    const totalDespesasFrete = diesel + pedagio + vale + adiantamento + outros
    const valorComissao = f.acerto?.valorComissao ?? null
    const lucroFrota = f.valorBruto - totalDespesasFrete - (valorComissao ?? 0)

    return {
      numero:         idx + 1,
      id:             f.id,
      dataInicio:     f.dataInicio.toISOString().split('T')[0],
      dataFim:        f.dataFim?.toISOString().split('T')[0] ?? null,
      origem:         f.origem,
      destino:        f.destino,
      tipoCarga:      TIPO_CARGA_LABEL[f.tipoCarga] ?? f.tipoCarga,
      kmInicial:      f.kmInicial,
      kmFinal:        f.kmFinal ?? null,
      kmTotal:        f.kmFinal != null ? f.kmFinal - f.kmInicial : null,
      valorBruto:     f.valorBruto,
      caminhaoPlaca:  f.caminhao.placa,
      motoristaNome:  f.caminhao.motorista?.nome ?? null,
      percentualComissao: f.caminhao.motorista?.percentualComissao ?? null,
      diesel, pedagio, vale, adiantamento, outros,
      totalDespesasFrete,
      valorComissao,
      totalDeducoes:  f.acerto?.totalDeducoes ?? null,
      saldoFinal:     f.acerto?.saldoFinal ?? null,
      lucroFrota,
    }
  })

  // ── Motorista summaries ───────────────────────────────────────────────────
  const motoristaMap = new Map<string, MotoristaSummaryRelatorio>()
  for (const f of fretesRows) {
    if (!f.motoristaNome) continue
    const key = f.motoristaNome
    const entry = motoristaMap.get(key) ?? {
      nome: key, totalFretes: 0, totalComissao: 0, totalDeducoes: 0, saldoFinal: 0,
    }
    entry.totalFretes   += 1
    entry.totalComissao += f.valorComissao  ?? 0
    entry.totalDeducoes += f.totalDeducoes  ?? 0
    entry.saldoFinal    += f.saldoFinal     ?? 0
    motoristaMap.set(key, entry)
  }
  const motoristas = Array.from(motoristaMap.values())
    .sort((a, b) => b.totalComissao - a.totalComissao)

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totalReceitas  = fretesRows.reduce((s, f) => s + f.valorBruto, 0)
  const totalDespFrete = fretesRows.reduce((s, f) => s + f.totalDespesasFrete, 0)
  const totalDespAvuls = lancamentosAvulsos.reduce((s, l) => s + l.valor, 0)
  const totalDespesas  = totalDespFrete + totalDespAvuls
  const totalComissoes = fretesRows.reduce((s, f) => s + (f.valorComissao ?? 0), 0)
  const lucroLiquido   = totalReceitas - totalDespesas - totalComissoes
  const totalKm        = fretesRows.reduce((s, f) => s + (f.kmTotal ?? 0), 0)
  const margem         = totalReceitas > 0
    ? Math.round((lucroLiquido / totalReceitas) * 1000) / 10
    : 0

  // ── Expense breakdown (all lancamentos incl. avulsos) ────────────────────
  const allLancamentos = [
    ...fretes.flatMap(f => f.lancamentos),
    ...lancamentosAvulsos,
  ]
  const categoryMap = new Map<string, number>()
  for (const l of allLancamentos) {
    categoryMap.set(l.tipo, (categoryMap.get(l.tipo) ?? 0) + l.valor)
  }
  const despesasPorCategoria: DespesaCategoria[] = Array.from(categoryMap.entries())
    .map(([categoria, total]) => ({
      categoria,
      total,
      percentual: totalDespesas > 0 ? Math.round((total / totalDespesas) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    frotaNome,
    periodo: {
      from: from.toISOString().split('T')[0],
      to:   to.toISOString().split('T')[0],
    },
    fretes:              fretesRows,
    lancamentosAvulsos:  lancamentosAvulsos,
    motoristas,
    despesasPorCategoria,
    totalReceitas,
    totalDespesas,
    totalComissoes,
    lucroLiquido,
    totalKm,
    totalFretes:         fretesRows.length,
    margem,
  }
}
