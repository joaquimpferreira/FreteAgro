// lib/acertos/aggregates.ts — Settlement analytics for the current filter selection
// Server-side only. Pure DB queries + math; no I/O side-effects.
// Principle IV: all money in centavos.

import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

export interface MonthPoint {
  mes: string // YYYY-MM
  valor: number
}

export interface MotoristaAcertoRanking {
  motoristaId: string
  nome: string
  count: number
  saldoTotal: number // centavos, acertos realizados
}

export interface AcertosStats {
  totalAcertos: number
  acertosPendentes: number
  acertosRealizados: number
  totalComissao: number  // centavos, acertos realizados
  totalDeducoes: number  // centavos, acertos realizados
  saldoTotal: number     // centavos, acertos realizados — already paid out
  saldoPendente: number  // centavos, acertos pendentes — owed but not yet paid
  saldoPorMes: MonthPoint[]
  porMotorista: MotoristaAcertoRanking[]
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function getAcertosStats(where: Prisma.AcertoWhereInput): Promise<AcertosStats> {
  const acertos = await prisma.acerto.findMany({
    where,
    select: {
      status: true,
      valorComissao: true,
      totalDeducoes: true,
      saldoFinal: true,
      createdAt: true,
      realizadoEm: true,
      motoristaId: true,
      motorista: { select: { nome: true } },
    },
  })

  const totalAcertos = acertos.length
  const realizados = acertos.filter((a) => a.status === 'realizado')
  const pendentes = acertos.filter((a) => a.status === 'pendente')

  const totalComissao = realizados.reduce((s, a) => s + a.valorComissao, 0)
  const totalDeducoes = realizados.reduce((s, a) => s + a.totalDeducoes, 0)
  const saldoTotal = realizados.reduce((s, a) => s + a.saldoFinal, 0)
  const saldoPendente = pendentes.reduce((s, a) => s + a.saldoFinal, 0)

  const mesMap = new Map<string, number>()
  for (const a of realizados) {
    const mes = monthKey(a.realizadoEm ?? a.createdAt)
    mesMap.set(mes, (mesMap.get(mes) ?? 0) + a.saldoFinal)
  }
  const saldoPorMes: MonthPoint[] = Array.from(mesMap.entries())
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  const motoristaMap = new Map<string, MotoristaAcertoRanking>()
  for (const a of realizados) {
    const entry = motoristaMap.get(a.motoristaId) ?? {
      motoristaId: a.motoristaId,
      nome: a.motorista.nome,
      count: 0,
      saldoTotal: 0,
    }
    entry.count += 1
    entry.saldoTotal += a.saldoFinal
    motoristaMap.set(a.motoristaId, entry)
  }
  const porMotorista = Array.from(motoristaMap.values())
    .sort((a, b) => b.saldoTotal - a.saldoTotal)
    .slice(0, 5)

  return {
    totalAcertos,
    acertosPendentes: pendentes.length,
    acertosRealizados: realizados.length,
    totalComissao,
    totalDeducoes,
    saldoTotal,
    saldoPendente,
    saldoPorMes,
    porMotorista,
  }
}
