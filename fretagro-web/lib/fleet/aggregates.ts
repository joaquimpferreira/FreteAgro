// lib/fleet/aggregates.ts — Fleet analytics queries (frota overview, caminhão, motorista)
// Server-side only. Pure DB queries + math; no I/O side-effects.
// Principle IV: all money in centavos. Km/consumption figures are plain numbers.

import { prisma } from '@/lib/db/prisma'

const FRETE_RECEITA_STATUSES = ['concluido', 'acerto_pendente', 'acerto_realizado'] as const

export interface MonthPoint {
  mes: string // YYYY-MM
  valor: number
}

// ─── Month helpers ──────────────────────────────────────────────────────────

function startOfMonthsAgo(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(1)
  d.setMonth(d.getMonth() - n)
  return d
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Builds a fixed 6-month series (oldest → newest), filling missing months with 0. */
function buildLast6MonthsSeries(map: Map<string, number>): MonthPoint[] {
  const out: MonthPoint[] = []
  const anchor = new Date()
  anchor.setDate(1)
  for (let i = 5; i >= 0; i--) {
    const cursor = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    const key = monthKey(cursor)
    out.push({ mes: key, valor: map.get(key) ?? 0 })
  }
  return out
}

// ─── Frota overview ─────────────────────────────────────────────────────────

export interface TopCaminhao {
  id: string
  placa: string
  modelo: string
  kmRodado: number
  receita: number // centavos
}

export interface FrotaOverviewStats {
  caminhoesAtivos: number
  caminhoesInativos: number
  caminhoesSemMotorista: number
  motoristasAtivos: number
  motoristasInativos: number
  fretesEmAndamento: number
  kmRodadoTotal: number
  litrosDieselTotal: number
  valorCombustivelTotal: number // centavos
  mediaConsumo: number | null   // km/l
  receitaTotal: number          // centavos, últimos 6 meses
  kmPorMes: MonthPoint[]
  topCaminhoes: TopCaminhao[]
}

export async function getFrotaOverviewStats(frotaId: string): Promise<FrotaOverviewStats> {
  const desde = startOfMonthsAgo(5)

  const [
    caminhoes,
    caminhoesSemMotorista,
    motoristasAtivos,
    motoristasInativos,
    fretesEmAndamento,
    trechos,
    abastecimentos,
    fretes,
  ] = await Promise.all([
    prisma.caminhao.findMany({
      where: { frotaId },
      select: { id: true, placa: true, modelo: true, status: true },
    }),
    prisma.caminhao.count({ where: { frotaId, status: 'ativo', motoristaId: null } }),
    prisma.motorista.count({ where: { frotaId, status: 'ativo' } }),
    prisma.motorista.count({ where: { frotaId, status: 'inativo' } }),
    prisma.frete.count({ where: { frotaId, status: 'em_andamento' } }),
    prisma.trechoKm.findMany({
      where: { frotaId, kmRodado: { not: null } },
      select: { kmRodado: true, fechadoEm: true, frete: { select: { caminhaoId: true } } },
    }),
    prisma.abastecimento.findMany({
      where: { frotaId },
      select: { subtipo: true, litros: true, valorTotal: true },
    }),
    prisma.frete.findMany({
      where: { frotaId, status: { in: [...FRETE_RECEITA_STATUSES] }, dataInicio: { gte: desde } },
      select: { valorBruto: true, caminhaoId: true },
    }),
  ])

  const caminhoesAtivos = caminhoes.filter((c) => c.status === 'ativo').length
  const caminhoesInativos = caminhoes.length - caminhoesAtivos

  const kmRodadoTotal = trechos.reduce((s, t) => s + (t.kmRodado ?? 0), 0)
  const litrosDieselTotal = abastecimentos
    .filter((a) => a.subtipo === 'diesel')
    .reduce((s, a) => s + Number(a.litros), 0)
  const valorCombustivelTotal = abastecimentos.reduce((s, a) => s + a.valorTotal, 0)
  const mediaConsumo = litrosDieselTotal > 0 ? kmRodadoTotal / litrosDieselTotal : null

  const receitaTotal = fretes.reduce((s, f) => s + f.valorBruto, 0)

  // km por mês (últimos 6 meses)
  const kmMonthMap = new Map<string, number>()
  for (const t of trechos) {
    if (!t.fechadoEm || t.kmRodado == null) continue
    const mes = monthKey(t.fechadoEm)
    kmMonthMap.set(mes, (kmMonthMap.get(mes) ?? 0) + t.kmRodado)
  }

  // Ranking por receita (últimos 6 meses) + km acumulado (histórico completo)
  const receitaPorCaminhao = new Map<string, number>()
  for (const f of fretes) {
    receitaPorCaminhao.set(f.caminhaoId, (receitaPorCaminhao.get(f.caminhaoId) ?? 0) + f.valorBruto)
  }
  const kmPorCaminhao = new Map<string, number>()
  for (const t of trechos) {
    if (t.kmRodado == null) continue
    const cId = t.frete.caminhaoId
    kmPorCaminhao.set(cId, (kmPorCaminhao.get(cId) ?? 0) + t.kmRodado)
  }
  const topCaminhoes: TopCaminhao[] = caminhoes
    .map((c) => ({
      id: c.id,
      placa: c.placa,
      modelo: c.modelo,
      kmRodado: kmPorCaminhao.get(c.id) ?? 0,
      receita: receitaPorCaminhao.get(c.id) ?? 0,
    }))
    .filter((c) => c.receita > 0 || c.kmRodado > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5)

  return {
    caminhoesAtivos,
    caminhoesInativos,
    caminhoesSemMotorista,
    motoristasAtivos,
    motoristasInativos,
    fretesEmAndamento,
    kmRodadoTotal,
    litrosDieselTotal,
    valorCombustivelTotal,
    mediaConsumo,
    receitaTotal,
    kmPorMes: buildLast6MonthsSeries(kmMonthMap),
    topCaminhoes,
  }
}

// ─── Caminhão detail ────────────────────────────────────────────────────────

export interface AbastecimentoResumo {
  id: string
  data: string
  subtipo: string
  litros: number
  valorTotal: number // centavos
  local: string | null
}

export interface CaminhaoStats {
  fretesRealizados: number
  receitaGerada: number  // centavos
  despesasTotais: number // centavos
  kmRodadoTotal: number
  litrosDieselTotal: number
  valorCombustivelTotal: number // centavos
  mediaConsumo: number | null   // km/l
  kmPorMes: MonthPoint[]
  ultimosAbastecimentos: AbastecimentoResumo[]
}

export async function getCaminhaoStats(caminhaoId: string, frotaId: string): Promise<CaminhaoStats> {
  const [fretes, trechos, abastecimentos, ultimosAbastecimentos] = await Promise.all([
    prisma.frete.findMany({
      where: { caminhaoId, frotaId },
      select: { valorBruto: true, status: true, lancamentos: { select: { valor: true } } },
    }),
    prisma.trechoKm.findMany({
      where: { frotaId, kmRodado: { not: null }, frete: { caminhaoId } },
      select: { kmRodado: true, fechadoEm: true },
    }),
    prisma.abastecimento.findMany({
      where: { frotaId, frete: { caminhaoId } },
      select: { subtipo: true, litros: true, valorTotal: true },
    }),
    prisma.abastecimento.findMany({
      where: { frotaId, frete: { caminhaoId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, subtipo: true, litros: true, valorTotal: true, local: true, createdAt: true },
    }),
  ])

  const fretesRealizados = fretes.filter((f) => f.status !== 'em_andamento').length
  const receitaGerada = fretes
    .filter((f) => (FRETE_RECEITA_STATUSES as readonly string[]).includes(f.status))
    .reduce((s, f) => s + f.valorBruto, 0)
  const lancamentosTotal = fretes.reduce(
    (s, f) => s + f.lancamentos.reduce((s2, l) => s2 + l.valor, 0),
    0,
  )

  const kmRodadoTotal = trechos.reduce((s, t) => s + (t.kmRodado ?? 0), 0)
  const litrosDieselTotal = abastecimentos
    .filter((a) => a.subtipo === 'diesel')
    .reduce((s, a) => s + Number(a.litros), 0)
  const valorCombustivelTotal = abastecimentos.reduce((s, a) => s + a.valorTotal, 0)
  // Fuel purchases reduce profit like any other expense
  const despesasTotais = lancamentosTotal + valorCombustivelTotal
  const mediaConsumo = litrosDieselTotal > 0 ? kmRodadoTotal / litrosDieselTotal : null

  const kmMonthMap = new Map<string, number>()
  for (const t of trechos) {
    if (!t.fechadoEm || t.kmRodado == null) continue
    const mes = monthKey(t.fechadoEm)
    kmMonthMap.set(mes, (kmMonthMap.get(mes) ?? 0) + t.kmRodado)
  }

  return {
    fretesRealizados,
    receitaGerada,
    despesasTotais,
    kmRodadoTotal,
    litrosDieselTotal,
    valorCombustivelTotal,
    mediaConsumo,
    kmPorMes: buildLast6MonthsSeries(kmMonthMap),
    ultimosAbastecimentos: ultimosAbastecimentos.map((a) => ({
      id: a.id,
      data: a.createdAt.toISOString(),
      subtipo: a.subtipo,
      litros: Number(a.litros),
      valorTotal: a.valorTotal,
      local: a.local,
    })),
  }
}

// ─── Motorista detail ───────────────────────────────────────────────────────

export interface AcertoResumo {
  id: string
  freteId: string
  valorComissao: number // centavos
  saldoFinal: number    // centavos
  status: string
  data: string
}

export interface MotoristaStats {
  fretesRealizados: number
  totalComissao: number // centavos, acertos realizados
  totalDeducoes: number // centavos
  saldoTotal: number    // centavos
  acertosPendentes: number
  comissaoPorMes: MonthPoint[]
  ultimosAcertos: AcertoResumo[]
}

export async function getMotoristaStats(motoristaId: string, frotaId: string): Promise<MotoristaStats> {
  const desde = startOfMonthsAgo(5)

  const [fretesRealizados, acertos, ultimosAcertos] = await Promise.all([
    prisma.frete.count({ where: { frotaId, motoristaId, status: { not: 'em_andamento' } } }),
    prisma.acerto.findMany({
      where: { motoristaId },
      select: { valorComissao: true, totalDeducoes: true, saldoFinal: true, status: true, realizadoEm: true, createdAt: true },
    }),
    prisma.acerto.findMany({
      where: { motoristaId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, freteId: true, valorComissao: true, saldoFinal: true, status: true, createdAt: true },
    }),
  ])

  const realizados = acertos.filter((a) => a.status === 'realizado')
  const totalComissao = realizados.reduce((s, a) => s + a.valorComissao, 0)
  const totalDeducoes = realizados.reduce((s, a) => s + a.totalDeducoes, 0)
  const saldoTotal = realizados.reduce((s, a) => s + a.saldoFinal, 0)
  const acertosPendentes = acertos.filter((a) => a.status === 'pendente').length

  const comissaoMonthMap = new Map<string, number>()
  for (const a of realizados) {
    const data = a.realizadoEm ?? a.createdAt
    if (data < desde) continue
    const mes = monthKey(data)
    comissaoMonthMap.set(mes, (comissaoMonthMap.get(mes) ?? 0) + a.valorComissao)
  }

  return {
    fretesRealizados,
    totalComissao,
    totalDeducoes,
    saldoTotal,
    acertosPendentes,
    comissaoPorMes: buildLast6MonthsSeries(comissaoMonthMap),
    ultimosAcertos: ultimosAcertos.map((a) => ({
      id: a.id,
      freteId: a.freteId,
      valorComissao: a.valorComissao,
      saldoFinal: a.saldoFinal,
      status: a.status,
      data: a.createdAt.toISOString(),
    })),
  }
}
