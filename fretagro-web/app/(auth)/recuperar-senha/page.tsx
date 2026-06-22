// "use client" — form with state management for submitted status
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { recuperarSenhaSchema, type RecuperarSenhaInput } from '@/lib/auth/schemas'

export default function RecuperarSenhaPage() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarSenhaInput>({
    resolver: zodResolver(recuperarSenhaSchema),
  })

  async function onSubmit(values: RecuperarSenhaInput) {
    // Fire-and-forget — no enumeration, always show success
    await fetch('/api/auth/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSubmitted(true)
  }

  return (
    <div className="rounded-card bg-surface-card p-8 shadow-lg">
      <div className="mb-6">
        <h2 className="text-h3 font-semibold text-grey-50">Recuperar senha</h2>
        <p className="mt-1 text-p-sm text-grey-400">
          Informe seu e-mail e enviaremos as instruções de recuperação.
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            className="rounded-input border border-primary-400/30 bg-primary-400/10 px-4 py-3 text-p-sm text-primary-300"
          >
            Se o e-mail estiver cadastrado, você receberá as instruções em breve.
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Voltar ao login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Enviando…' : 'Enviar instruções'}
            </Button>
          </form>

          <p className="mt-6 text-center text-p-sm text-grey-400">
            <Link href="/login" className="text-primary-400 hover:underline">
              Voltar ao login
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
