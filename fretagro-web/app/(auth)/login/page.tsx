// app/(auth)/login/page.tsx — Login page
// Server Component wrapping the client LoginForm.
// Reads callbackUrl from searchParams to redirect after successful login.

import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Entrar — FreteAgro',
}

interface LoginPageProps {
  searchParams: { callbackUrl?: string; cadastro?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = searchParams.callbackUrl ?? '/'
  const cadastroOk  = searchParams.cadastro === 'ok'

  return (
    <div className="rounded-card bg-surface-card p-8 shadow-lg">
      <div className="mb-6">
        <h2 className="text-h3 font-semibold text-grey-50">Entrar</h2>
        <p className="mt-1 text-p-sm text-grey-400">Acesse sua conta para gerenciar a frota</p>
      </div>

      {cadastroOk && (
        <div
          role="status"
          className="mb-4 rounded-input border border-primary-400/30 bg-primary-400/10 px-4 py-3 text-p-sm text-primary-300"
        >
          Conta criada com sucesso! Faça o login para continuar.
        </div>
      )}

      <LoginForm callbackUrl={callbackUrl} />

      <div className="mt-6 flex flex-col gap-3 text-center text-p-sm text-grey-400">
        <Link href="/recuperar-senha" className="text-primary-400 hover:underline">
          Esqueceu a senha?
        </Link>
        <span>
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-primary-400 hover:underline">
            Cadastre-se
          </Link>
        </span>
      </div>
    </div>
  )
}
