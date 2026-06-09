// Server Component — auth guard lives in middleware; this layout assembles UI.
// Principle II: session check delegated to lib/auth/config.ts via middleware.ts.
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from './_components/DashboardLayoutClient'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Secondary guard — middleware handles redirects, but this confirms session
  // is available for SSR data fetching in child Server Components.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth() as any
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <DashboardLayoutClient userName={session.user.name ?? undefined}>
      {children}
    </DashboardLayoutClient>
  )
}
