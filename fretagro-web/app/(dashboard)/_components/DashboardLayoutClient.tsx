// "use client" — layout manages sidebar open/close interactive state
'use client'

import * as React from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

// This layout wraps all (dashboard) routes.
// Auth guard is enforced by middleware.ts (lib/auth/config.ts) — Principle II.
// Every authenticated (dashboard) route passes through this layout.

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userName?: string
}

export function DashboardLayoutClient({ children, userName }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar — always visible on desktop, slide-in on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          userName={userName}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
