// "use client" — interactive form requiring browser events and state
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginInput } from '@/lib/auth/schemas'

interface LoginFormProps {
  callbackUrl?: string
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginInput) {
    setServerError(null)
    const result = await signIn('credentials', {
      email:    values.email,
      password: values.senha,
      redirect: false,
    })

    if (!result || result.error) {
      setServerError('E-mail ou senha inválidos.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.senha?.message}
        {...register('senha')}
      />

      {serverError && (
        <p role="alert" className="text-p-sm text-error-400">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
