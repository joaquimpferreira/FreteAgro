// components/dashboard/DashboardPeriodSelector.tsx — URL-driven period selector for dashboard (US6)
// "use client" — uses Next.js router to update URL search params on period change.
// Wraps the existing PeriodSelector and maps its PeriodOption enum to the FR-035 preset names.

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { PeriodSelector, type PeriodOption } from '@/components/shared/PeriodSelector'

// Map PeriodSelector options → FR-035 API preset names
const OPTION_TO_PRESET: Record<PeriodOption, string> = {
  this_month:   'este_mes',
  last_month:   'mes_passado',
  last_3_months:'ultimos_3_meses',
  this_year:    'este_ano',
  custom:       'personalizado',
}

const PRESET_TO_OPTION: Record<string, PeriodOption> = {
  este_mes:        'this_month',
  mes_passado:     'last_month',
  ultimos_3_meses: 'last_3_months',
  este_ano:        'this_year',
  personalizado:   'custom',
}

interface DashboardPeriodSelectorProps {
  currentPeriodo: string
  from?: string
  to?: string
}

export function DashboardPeriodSelector({
  currentPeriodo,
  from: _from,
  to: _to,
}: DashboardPeriodSelectorProps) {
  const router  = useRouter()
  const pathname = usePathname()

  const option = PRESET_TO_OPTION[currentPeriodo] ?? 'this_month'

  function handleChange(period: PeriodOption, range: { from: string; to: string }) {
    const params = new URLSearchParams()
    params.set('periodo', OPTION_TO_PRESET[period] ?? 'este_mes')
    params.set('from', range.from)
    params.set('to', range.to)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <PeriodSelector
      value={option}
      onChange={handleChange}
      className="w-48"
    />
  )
}
