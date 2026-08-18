// components/shared/RankingBarList.tsx — Numbered ranking list with proportional bars
// Server Component — no interactivity, data passed as props.
// Used by fleet/freight analytics panels to keep ranking UI consistent.

import type { ReactNode } from 'react'

export interface RankingBarItem {
  key: string
  icon?: ReactNode
  label: string
  value: string // formatted right-aligned text, e.g. "R$ 22.500,00 · 1.979 km"
  pct: number   // 0–100 bar width
}

interface RankingBarListProps {
  items: RankingBarItem[]
  emptyMessage: string
}

export function RankingBarList({ items, emptyMessage }: RankingBarListProps) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={item.key} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
          {item.icon}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.value}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
