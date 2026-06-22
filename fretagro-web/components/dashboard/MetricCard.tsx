// components/dashboard/MetricCard.tsx — KPI card matching shadcn dashboard-01 style
// Server Component — no interactivity; data passed as props.

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface MetricCardProps {
  label: string
  value: string
  href?: string
  trend?: string
  trendUp?: boolean
  description?: string
  sublabel?: string
}

export function MetricCard({
  label,
  value,
  href,
  trend,
  trendUp,
  description,
  sublabel,
}: MetricCardProps) {
  const content = (
    <Card className="@container/card bg-gradient-to-t from-primary/5 to-card">
      <CardHeader className="relative">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {trend && (
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {trendUp ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {trend}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        {description && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {description}
            {trendUp !== undefined && (
              trendUp
                ? <TrendingUp className="size-4" />
                : <TrendingDown className="size-4" />
            )}
          </div>
        )}
        {sublabel && (
          <div className="text-muted-foreground">{sublabel}</div>
        )}
      </CardFooter>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

