// app/(dashboard)/perfil/_components/PerfilForm.tsx — Editable profile form
// "use client" — React Hook Form + interactive submit + success feedback

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { whatsappSchema, estadoSchema } from '@/lib/utils/validators'

// ─── Zod schema (client-side mirrors API schema) ─────────────────────────────

const schema = z.object({
  nome:     z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100),
  whatsapp: whatsappSchema,
  frotaNome: z.string().min(2, 'Nome da frota deve ter pelo menos 2 caracteres.').max(100).optional(),
  estado:    estadoSchema.optional(),
  cnpjCpf:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Estado options ───────────────────────────────────────────────────────────

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface PerfilFormProps {
  initialUser: {
    nome:     string
    whatsapp: string
  }
  email: string
  initialFrota?: {
    frotaNome: string
    estado:    string
    cnpjCpf:   string
  }
  isDono: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerfilForm({ initialUser, email, initialFrota, isDono }: PerfilFormProps) {
  const router   = useRouter()
  const [saved, setSaved]       = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome:      initialUser.nome,
      whatsapp:  initialUser.whatsapp,
      frotaNome: initialFrota?.frotaNome ?? '',
      estado:    (initialFrota?.estado as (typeof UFS)[number]) ?? undefined,
      cnpjCpf:   initialFrota?.cnpjCpf ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setSaved(false)
    try {
      const body: Record<string, unknown> = {
        nome:     values.nome,
        whatsapp: values.whatsapp,
      }
      if (isDono) {
        if (values.frotaNome) body.frotaNome = values.frotaNome
        if (values.estado)    body.estado    = values.estado
        if (values.cnpjCpf !== undefined) body.cnpjCpf = values.cnpjCpf
      }

      const res = await fetch('/api/perfil', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        const detail = data.details
          ? Object.values(data.details as Record<string, string[]>).flat().join(' ')
          : (data.message ?? 'Erro ao salvar perfil.')
        setServerError(detail)
        return
      }

      setSaved(true)
      // Refresh Server Component data (session name might have changed)
      router.refresh()
    } catch {
      setServerError('Erro de rede. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {/* ── Personal data ──────────────────────────────────────────────────── */}
      <Input
        label="Nome completo"
        type="text"
        autoComplete="name"
        error={errors.nome?.message}
        {...register('nome')}
      />

      {/* Email — read-only; identity is owned by Supabase Auth */}
      <div className="flex flex-col gap-1.5">
        <label className="text-p-sm font-medium text-grey-200">E-mail</label>
        <div className="flex h-10 items-center rounded-input border border-grey-800 bg-surface-bg px-3 text-p-sm text-grey-500 cursor-not-allowed select-none">
          {email}
        </div>
        <p className="text-caption text-grey-600">O e-mail não pode ser alterado.</p>
      </div>

      <Input
        label="WhatsApp"
        type="tel"
        autoComplete="tel"
        placeholder="65999990000"
        error={errors.whatsapp?.message}
        {...register('whatsapp')}
      />

      {/* ── Fleet data — dono only ─────────────────────────────────────────── */}
      {isDono && (
        <>
          <hr className="border-grey-800" />
          <p className="text-p-sm font-semibold text-grey-200">Dados da frota</p>

          <Input
            label="Nome da frota / empresa"
            type="text"
            error={errors.frotaNome?.message}
            {...register('frotaNome')}
          />

          {/* Estado select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="estado" className="text-p-sm font-medium text-grey-200">
              Estado (UF)
            </label>
            <select
              id="estado"
              className="flex h-10 w-full rounded-input border border-grey-700 bg-surface-elevated px-3 py-2 text-p-sm text-grey-50 transition-colors focus-visible:outline-none focus-visible:border-primary-400 focus-visible:ring-1 focus-visible:ring-primary-400"
              {...register('estado')}
            >
              <option value="">Selecione...</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            {errors.estado && (
              <p className="text-p-sm text-error-400">{errors.estado.message}</p>
            )}
          </div>

          <Input
            label="CPF / CNPJ (opcional)"
            type="text"
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
            error={errors.cnpjCpf?.message}
            {...register('cnpjCpf')}
          />
        </>
      )}

      {/* ── Feedback ──────────────────────────────────────────────────────── */}
      {serverError && (
        <p role="alert" className="text-p-sm text-error-400">{serverError}</p>
      )}

      {saved && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-input border border-success-400/30 bg-success-400/10 px-3 py-2 text-p-sm text-success-400"
        >
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Salvando…
            </span>
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>
    </form>
  )
}
