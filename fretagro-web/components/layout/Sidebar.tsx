// "use client" — sidebar requires interactive navigation state and mobile toggle
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Package,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/frota',     label: 'Frota',      icon: Truck           },
  { href: '/fretes',    label: 'Fretes',     icon: Package         },
  { href: '/acertos',   label: 'Acertos',    icon: DollarSign      },
  { href: '/caixa',     label: 'Caixa',      icon: Wallet          },
  { href: '/relatorios',label: 'Relatórios', icon: BarChart3       },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          // Dark sidebar — grey-900 per dashboard identity (design-system tokens)
          'fixed left-0 top-0 z-30 flex h-full w-64 flex-col',
          'bg-grey-900 border-r border-grey-800 transition-transform duration-200',
          // Desktop: always visible; Mobile: slide in/out
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-grey-800">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary-400" aria-hidden="true" />
            <span className="text-p-md font-semibold text-grey-50">FreteAgro</span>
          </Link>
          {/* Mobile close button — icon-only MUST carry aria-label (Principle III) */}
          <button
            className="lg:hidden text-grey-400 hover:text-grey-100"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Menu principal">
          <ul className="flex flex-col gap-1" role="list">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-input px-3 py-2 text-p-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-400/10 text-primary-400'
                        : 'text-grey-400 hover:bg-grey-800 hover:text-grey-100',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Settings link */}
        <div className="border-t border-grey-800 p-3">
          <Link
            href="/configuracoes"
            className={cn(
              'flex items-center gap-3 rounded-input px-3 py-2 text-p-sm font-medium transition-colors',
              pathname.startsWith('/configuracoes')
                ? 'bg-primary-400/10 text-primary-400'
                : 'text-grey-400 hover:bg-grey-800 hover:text-grey-100',
            )}
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
            Configurações
          </Link>
        </div>
      </aside>
    </>
  )
}
