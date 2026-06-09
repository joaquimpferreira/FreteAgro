// "use client" — input element requires DOM interaction
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Optional label — every input MUST have a label (Principle III / WCAG AA)
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-p-sm font-medium text-grey-200"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            // Base dark-theme input (Principle III — radius-input = 8px)
            'flex h-10 w-full rounded-input border border-grey-700 bg-surface-elevated px-3 py-2',
            'text-p-sm text-grey-50 placeholder:text-grey-500',
            'transition-colors',
            // Focus (Principle III — WCAG AA via globals.css :focus-visible)
            'focus-visible:outline-none focus-visible:border-primary-400 focus-visible:ring-1 focus-visible:ring-primary-400',
            // Error state
            error && 'border-error-400 focus-visible:border-error-400 focus-visible:ring-error-400',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Mobile — full width (minimum 375px; Principle III)
            'min-w-0',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-p-sm text-error-400">{error}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
