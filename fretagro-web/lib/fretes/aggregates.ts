// lib/fretes/aggregates.ts — Freight analytics for the current filter selection
// Server-side only. Pure DB queries + math; no I/O side-effects.
// Principle IV: all money in centavos.

import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

export interface MonthPoint {
  mes: string // YYYY-MM
  valor: number
}

export interface StatusCount {
  status: string
  count: number
}

export interface TipoCargaStat {
  tipo: string
  count: number
  valor: number // centavos
}

export interface FretesStats {
  totalFretes: number
  valorTotal: number     // centavos
  despesasTotais: number // centavos
  ticketMedio: number    // centavos
  kmTotal: number
  porStatus: StatusCount[]
  porTipoCarga: TipoCargaStat[]
  valorPorMes: MonthPoint[]
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function getFretesStats(where: Prisma.FreteWhereInput): Promise<FretesStats> {
  const fretes = await prisma.frete.findMany({
    where,
    select: {
      valorBruto: true,
      status: true,
      tipoCarga: true,
      kmInicial: true,
      kmFinal: true,
      dataInicio: true,
      lancamentos: { select: { valor: true } },
      // Fuel purchases reduce profit like any other expense
      abastecimentos: { select: { valorTotal: true } },
    },
  })

  const totalFretes = fretes.length
  const valorTotal = fretes.reduce((s, f) => s + f.valorBruto, 0)
  const despesasTotais = fretes.reduce(
    (s, f) => s
      + f.lancamentos.reduce((s2, l) => s2 + l.valor, 0)
      + f.abastecimentos.reduce((s2, a) => s2 + a.valorTotal, 0),
    0,
  )
  const ticketMedio = totalFretes > 0 ? Math.round(valorTotal / totalFretes) : 0
  const kmTotal = fretes.reduce(
    (s, f) => s + (f.kmFinal != null ? Math.max(0, f.kmFinal - f.kmInicial) : 0),
    0,
  )

  const statusMap = new Map<string, number>()
  const tipoMap = new Map<string, { count: number; valor: number }>()
  const mesMap = new Map<string, number>()

  for (const f of fretes) {
    statusMap.set(f.status, (statusMap.get(f.status) ?? 0) + 1)

    const tipo = tipoMap.get(f.tipoCarga) ?? { count: 0, valor: 0 }
    tipo.count += 1
    tipo.valor += f.valorBruto
    tipoMap.set(f.tipoCarga, tipo)

    const mes = monthKey(f.dataInicio)
    mesMap.set(mes, (mesMap.get(mes) ?? 0) + f.valorBruto)
  }

  const porStatus: StatusCount[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))

  const porTipoCarga: TipoCargaStat[] = Array.from(tipoMap.entries())
    .map(([tipo, v]) => ({ tipo, ...v }))
    .sort((a, b) => b.valor - a.valor)

  const valorPorMes: MonthPoint[] = Array.from(mesMap.entries())
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  return {
    totalFretes,
    valorTotal,
    despesasTotais,
    ticketMedio,
    kmTotal,
    porStatus,
    porTipoCarga,
    valorPorMes,
  }
}
