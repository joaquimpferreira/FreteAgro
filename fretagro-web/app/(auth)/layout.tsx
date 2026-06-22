// app/(auth)/layout.tsx — Layout for unauthenticated pages (login, cadastro, recuperar-senha)
// Server Component — no auth guard needed (public routes)

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FreteAgro — Acesso',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-h2 font-bold text-primary-400">FreteAgro</h1>
          <p className="mt-1 text-p-sm text-grey-400">Gestão de Frota Agrícola</p>
        </div>
        {children}
      </div>
    </div>
  )
}
