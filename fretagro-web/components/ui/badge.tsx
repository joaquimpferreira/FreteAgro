import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

// Server Component — no interactivity needed
const badgeVariants = cva(
  // Base — radius-badge = 8px (Principle III)
  'inline-flex items-center rounded-badge border px-2.5 py-0.5 text-caption font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary-400/20 text-primary-300',
        secondary:   'border-transparent bg-secondary-400/20 text-secondary-300',
        destructive: 'border-transparent bg-error-400/20 text-error-300',
        warning:     'border-transparent bg-warning-400/20 text-warning-300',
        success:     'border-transparent bg-success-400/20 text-success-300',
        outline:     'border-grey-700 text-grey-300',
        // Freight status badges
        em_andamento:     'border-transparent bg-secondary-400/20 text-secondary-300',
        concluido:        'border-transparent bg-grey-700/40 text-grey-300',
        acerto_pendente:  'border-transparent bg-warning-400/20 text-warning-300',
        acerto_realizado: 'border-transparent bg-success-400/20 text-success-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
