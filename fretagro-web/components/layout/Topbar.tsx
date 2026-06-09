// "use client" — topbar requires interactive sign-out and mobile menu toggle
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Menu, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onMenuToggle?: () => void
  userName?: string
}

export function Topbar({ onMenuToggle, userName }: TopbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-grey-800 bg-grey-900 px-4 sm:px-6">
      {/* Mobile hamburger — icon-only MUST carry aria-label (Principle III) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Desktop spacer */}
      <div className="hidden lg:flex" />

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {userName && (
          <div className="flex items-center gap-2 text-p-sm text-grey-300">
            <User className="h-4 w-4 text-grey-400" aria-hidden="true" />
            <span className="hidden sm:inline">{userName}</span>
          </div>
        )}
        {/* Sign out — icon-only MUST carry aria-label (Principle III) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Sair da conta"
          title="Sair"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}
