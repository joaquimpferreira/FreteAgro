// "use client" — interactive form requiring browser events and state
'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cadastroStep2Schema, type CadastroStep2Input } from '@/lib/auth/schemas'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const

interface CadastroStep2FormProps {
  step1Data: {
    nome: string
    email: string
    whatsapp: string
    senha: string
  }
  onBack: () => void
}

export function CadastroStep2Form({ step1Data, onBack }: CadastroStep2FormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CadastroStep2Input>({
    resolver: zodResolver(cadastroStep2Schema),
  })

  async function onSubmit(values: CadastroStep2Input) {
    setServerError(null)
    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...step1Data,
          frotaNome: values.frotaNome,
          estado:    values.estado,
          cnpjCpf:   values.cnpjCpf ?? undefined,
        }),
      })

      if (res.status === 409) {
        setServerError('E-mail já cadastrado. Tente fazer login ou use outro e-mail.')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body?.message ?? 'Erro ao criar conta. Tente novamente.')
        return
      }

      // Registration successful — redirect to login
      router.push('/login?cadastro=ok')
    } catch {
      setServerError('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Input
        label="Nome da frota / empresa"
        type="text"
        placeholder="Transportes Silva"
        error={errors.frotaNome?.message}
        {...register('frotaNome')}
      />

      <Controller
        name="estado"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger label="Estado (UF)" id="estado">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.estado && (
              <p className="text-p-sm text-error-400">{errors.estado.message}</p>
            )}
          </div>
        )}
      />

      <Input
        label="CPF ou CNPJ (opcional)"
        type="text"
        placeholder="000.000.000-00 ou 00.000.000/0001-00"
        error={errors.cnpjCpf?.message}
        {...register('cnpjCpf')}
      />

      {serverError && (
        <p role="alert" className="text-p-sm text-error-400">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </div>
    </form>
  )
}
