// "use client" — interactive element that requires browser event handling
'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  // Base — dark theme (Principle III)
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input text-p-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary action — green (Principle III: primary-400)
        default:
          'bg-primary-400 text-grey-900 hover:bg-primary-300 active:bg-primary-500',
        // Destructive
        destructive:
          'bg-error-400 text-white hover:bg-error-300 active:bg-error-500',
        // Outline
        outline:
          'border border-grey-700 bg-transparent text-grey-100 hover:bg-surface-elevated active:bg-surface-card',
        // Ghost
        ghost:
          'bg-transparent text-grey-300 hover:bg-surface-elevated hover:text-grey-100',
        // Secondary
        secondary:
          'bg-secondary-400 text-white hover:bg-secondary-300 active:bg-secondary-500',
        // Link
        link:
          'text-primary-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 rounded-input px-3 text-xs',
        lg:      'h-12 rounded-input px-8',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
