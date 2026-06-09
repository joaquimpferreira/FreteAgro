import * as React from 'react'
import { cn } from '@/lib/utils/cn'

// Server Component — table primitives styled for the dark theme

function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-p-sm text-grey-200', className)}
        {...props}
      />
    </div>
  )
}
Table.displayName = 'Table'

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-grey-800', className)} {...props} />
}
TableHeader.displayName = 'TableHeader'

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
}
TableBody.displayName = 'TableBody'

function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn('border-t border-grey-800 bg-surface-elevated font-medium text-grey-50', className)}
      {...props}
    />
  )
}
TableFooter.displayName = 'TableFooter'

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-grey-800/50 transition-colors',
        'hover:bg-surface-elevated/50',
        'data-[state=selected]:bg-surface-elevated',
        className,
      )}
      {...props}
    />
  )
}
TableRow.displayName = 'TableRow'

function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle text-caption font-semibold text-grey-400',
        '[&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  )
}
TableHead.displayName = 'TableHead'

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
}
TableCell.displayName = 'TableCell'

function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn('mt-4 text-p-sm text-grey-400', className)} {...props} />
}
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption }
