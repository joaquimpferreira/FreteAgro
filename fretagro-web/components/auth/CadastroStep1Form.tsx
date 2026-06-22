// "use client" — interactive form requiring browser events and state
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cadastroStep1Schema, type CadastroStep1Input } from '@/lib/auth/schemas'

interface CadastroStep1FormProps {
  onNext: (values: CadastroStep1Input) => void
}

export function CadastroStep1Form({ onNext }: CadastroStep1FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroStep1Input>({
    resolver: zodResolver(cadastroStep1Schema),
  })

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <Input
        label="Nome completo"
        type="text"
        autoComplete="name"
        placeholder="João Silva"
        error={errors.nome?.message}
        {...register('nome')}
      />

      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="WhatsApp"
        type="tel"
        autoComplete="tel"
        placeholder="(65) 99999-0000"
        error={errors.whatsapp?.message}
        {...register('whatsapp')}
      />

      <Input
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        error={errors.senha?.message}
        {...register('senha')}
      />

      <Input
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmarSenha?.message}
        {...register('confirmarSenha')}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        Próximo
      </Button>
    </form>
  )
}
