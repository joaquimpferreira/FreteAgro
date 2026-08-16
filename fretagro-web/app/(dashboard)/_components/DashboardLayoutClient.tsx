// "use client" — SidebarProvider requires browser context for sidebar state
'use client'

import * as React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userName?: string
  userEmail?: string
}

export function DashboardLayoutClient({ children, userName, userEmail }: DashboardLayoutClientProps) {
  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userEmail={userEmail} />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col p-4 pt-3 md:p-5 md:pt-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
