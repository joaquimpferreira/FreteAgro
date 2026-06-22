// components/dashboard/LancamentoAvulsoForm.tsx — Manual avulso outflow form (US5, FR-030)
// "use client" — interactive form with React Hook Form + Zod

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  lancamentoCaixaSchema,
  TIPOS_LANCAMENTO_AVULSO,
  type LancamentoCaixaInput,
} from '@/lib/caixa/schemas'

// ─── Display labels ───────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  combustivel:  'Combustível',
  borracharia:  'Borracharia',
  patio:        'Pátio',
  pedagio:      'Pedágio',
  oficina:      'Oficina',
  vale:         'Vale',
  adiantamento: 'Adiantamento',
  salario:      'Salário',
  ipva:         'IPVA',
  seguro:       'Seguro',
  outro:        'Outro',
}

// ─── Form state type (uses reais for display; converts to centavos on submit) ─

interface LancamentoFormValues {
  tipo: string
  descricao: string
  valorReais: string // display as R$ string; converted on submit
  data: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LancamentoAvulsoFormProps {
  onSubmit: (input: LancamentoCaixaInput) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LancamentoAvulsoForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: LancamentoAvulsoFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  // Use the Zod schema for backend-shape validation, but collect valor as string
  // to allow natural "12.50" input before conversion.
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LancamentoFormValues>({
    defaultValues: {
      tipo:       '',
      descricao:  '',
      valorReais: '',
      data:       new Date().toISOString().split('T')[0],
    },
  })

  const tipoValue = watch('tipo')

  const handleFormSubmit = handleSubmit(async (values) => {
    setServerError(null)

    // Convert R$ value to centavos (integer)
    const reaisStr = values.valorReais.replace(',', '.')
    const reais    = parseFloat(reaisStr)
    if (isNaN(reais) || reais < 0) {
      setServerError('Valor inválido. Use o formato 12.50 (reais).')
      return
    }
    const valorCentavos = Math.round(reais * 100)

    // Validate with full schema before sending
    const parseResult = lancamentoCaixaSchema.safeParse({
      tipo:      values.tipo,
      descricao: values.descricao || undefined,
      valor:     valorCentavos,
      data:      values.data,
    })
    if (!parseResult.success) {
      setServerError(parseResult.error.errors[0]?.message ?? 'Dados inválidos.')
      return
    }

    try {
      await onSubmit(parseResult.data)
      reset()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao registrar lançamento.')
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" noValidate>
      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <Select
          value={tipoValue}
          onValueChange={(val) => setValue('tipo', val)}
        >
          <SelectTrigger label="Tipo de Despesa">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_LANCAMENTO_AVULSO.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {TIPO_LABELS[tipo] ?? tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo && (
          <p className="text-p-sm text-error-400">{errors.tipo.message}</p>
        )}
      </div>

      {/* Descrição */}
      <Input
        label="Descrição (opcional)"
        placeholder="Ex.: Salário motorista mai/26"
        maxLength={200}
        {...register('descricao')}
      />

      {/* Valor */}
      <div className="flex flex-col gap-1.5">
        <Input
          label="Valor (R$)"
          placeholder="0,00"
          inputMode="decimal"
          {...register('valorReais')}
        />
        {errors.valorReais && (
          <p className="text-p-sm text-error-400">{errors.valorReais.message}</p>
        )}
      </div>

      {/* Data */}
      <div className="flex flex-col gap-1.5">
        <Input
          label="Data"
          type="date"
          {...register('data')}
        />
        {errors.data && (
          <p className="text-p-sm text-error-400">{errors.data.message}</p>
        )}
      </div>

      {/* Server-side error */}
      {serverError && (
        <p role="alert" className="text-p-sm text-error-400">
          {serverError}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando…' : 'Registrar Saída'}
        </Button>
      </div>
    </form>
  )
}
