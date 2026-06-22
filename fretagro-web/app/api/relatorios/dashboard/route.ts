// app/api/relatorios/dashboard/route.ts — Dashboard KPI endpoint
// GET /api/relatorios/dashboard — returns KPIs, alerts, charts for the dashboard
// US6 — FR-033, FR-034, FR-035 · contracts/relatorios.md
// Owner-only; scoped to caller's frotaId. Cached via Next.js revalidate.

import { requireFrotaId } from '@/lib/api/tenant'
import { forbidden, internalError, ok } from '@/lib/api/errors'
import { getDashboardData, resolvePeriod, type PeriodPreset } from '@/lib/dashboard/aggregates'

// Revalidate KPIs every 5 minutes per SC-005
export const revalidate = 300

const VALID_PRESETS = new Set<PeriodPreset>([
  'este_mes',
  'mes_passado',
  'ultimos_3_meses',
  'este_ano',
  'personalizado',
])

export async function GET(req: Request) {
  const { context, response } = await requireFrotaId()
  if (response) return response
  const { frotaId, role } = context

  // Dashboard is owner-only (FR-033)
  if (role !== 'dono') {
    return forbidden('Apenas o dono da frota pode acessar o dashboard.')
  }

  const url = new URL(req.url)
  const periodoParam = url.searchParams.get('periodo') ?? 'este_mes'
  const from         = url.searchParams.get('from')  ?? undefined
  const to           = url.searchParams.get('to')    ?? undefined

  const periodo = VALID_PRESETS.has(periodoParam as PeriodPreset)
    ? (periodoParam as PeriodPreset)
    : 'este_mes'

  const period = resolvePeriod(periodo, from, to)

  try {
    const data = await getDashboardData(frotaId, period)
    return ok(data)
  } catch (err) {
    console.error('[GET /api/relatorios/dashboard]', err)
    return internalError()
  }
}
