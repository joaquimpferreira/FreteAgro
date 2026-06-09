import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// Server Component — pure presentational card

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // Dark theme card — radius-card = 10px, surface-card background (Principle III)
      className={cn(
        'rounded-card border border-grey-800 bg-surface-card shadow-card',
        className,
      )}
      {...props}
    />
  )
}
Card.displayName = 'Card'

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}
CardHeader.displayName = 'CardHeader'

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-h6 font-semibold leading-none tracking-tight text-grey-50', className)}
      {...props}
    />
  )
}
CardTitle.displayName = 'CardTitle'

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-p-sm text-grey-400', className)} {...props} />
}
CardDescription.displayName = 'CardDescription'

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}
CardContent.displayName = 'CardContent'

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
