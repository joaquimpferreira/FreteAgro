// "use client" — PeriodSelector requires user interaction to change date range
'use client'

import * as React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from 'date-fns'

export type PeriodOption =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_year'
  | 'custom'

export interface DateRange {
  from: string
  to: string
}

interface PeriodSelectorProps {
  value?: PeriodOption
  onChange: (period: PeriodOption, range: DateRange) => void
  className?: string
}

function getDateRange(period: PeriodOption): DateRange {
  const now = new Date()
  switch (period) {
    case 'this_month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to:   format(endOfMonth(now),   'yyyy-MM-dd'),
      }
    case 'last_month': {
      const last = subMonths(now, 1)
      return {
        from: format(startOfMonth(last), 'yyyy-MM-dd'),
        to:   format(endOfMonth(last),   'yyyy-MM-dd'),
      }
    }
    case 'last_3_months':
      return {
        from: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
        to:   format(endOfMonth(now),                 'yyyy-MM-dd'),
      }
    case 'this_year':
      return {
        from: format(startOfYear(now),  'yyyy-MM-dd'),
        to:   format(endOfMonth(now),   'yyyy-MM-dd'),
      }
    default:
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to:   format(endOfMonth(now),   'yyyy-MM-dd'),
      }
  }
}

export function PeriodSelector({ value = 'this_month', onChange, className }: PeriodSelectorProps) {
  function handleChange(val: string) {
    const period = val as PeriodOption
    onChange(period, getDateRange(period))
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={className} aria-label="Selecionar período">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="this_month">Este mês</SelectItem>
        <SelectItem value="last_month">Mês passado</SelectItem>
        <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
        <SelectItem value="this_year">Este ano</SelectItem>
        <SelectItem value="custom">Personalizado</SelectItem>
      </SelectContent>
    </Select>
  )
}

export { getDateRange }
