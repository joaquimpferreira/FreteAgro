// app/(auth)/cadastro/page.tsx — Registration step 1 (dados pessoais)
// "use client" — manages multi-step state and routes to step 2
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CadastroStep1Form } from '@/components/auth/CadastroStep1Form'
import type { CadastroStep1Input } from '@/lib/auth/schemas'

export default function CadastroPage() {
  const router = useRouter()

  function handleStep1Done(values: CadastroStep1Input) {
    sessionStorage.setItem(
      '__cadastro_step1',
      JSON.stringify({
        nome:     values.nome,
        email:    values.email,
        whatsapp: values.whatsapp,
        senha:    values.senha,
      }),
    )
    router.push('/cadastro/frota')
  }

  return (
    <div className="rounded-card bg-surface-card p-8 shadow-lg">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-400 text-p-xs font-bold text-grey-900">
          1
        </div>
        <div className="h-px flex-1 bg-grey-700" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-grey-700 text-p-xs font-medium text-grey-400">
          2
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-h3 font-semibold text-grey-50">Criar conta</h2>
        <p className="mt-1 text-p-sm text-grey-400">Seus dados de acesso</p>
      </div>

      <CadastroStep1Form onNext={handleStep1Done} />

      <p className="mt-6 text-center text-p-sm text-grey-400">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary-400 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
