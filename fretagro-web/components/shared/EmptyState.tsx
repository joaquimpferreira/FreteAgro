import * as React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Server Component — no interactivity needed

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ElementType
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-grey-700 p-12 text-center',
        className,
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-card bg-grey-800">
        <Icon className="h-6 w-6 text-grey-400" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-p-md font-medium text-grey-200">{title}</p>
        {description && <p className="text-p-sm text-grey-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
