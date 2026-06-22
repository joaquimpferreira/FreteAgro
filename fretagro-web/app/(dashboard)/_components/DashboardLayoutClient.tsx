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
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 pt-4 md:gap-6 md:p-6 md:pt-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
