// components/fretes/FreteForm.tsx — Create/edit freight form
// "use client" — form with React Hook Form + Zod

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { freteCreateSchema, type FreteCreateInput } from '@/lib/fretes/schemas'

interface CaminhaoOption {
  id: string
  placa: string
  modelo: string
}

interface FreteFormProps {
  caminhoes: CaminhaoOption[]
  onSubmit: (data: FreteCreateInput) => Promise<void>
  isLoading?: boolean
}

export function FreteForm({ caminhoes, onSubmit, isLoading }: FreteFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FreteCreateInput>({
    resolver: zodResolver(freteCreateSchema),
    defaultValues: {
      dataInicio: new Date().toISOString().slice(0, 16),
    },
  })

  const tipoCargaValue = watch('tipoCarga')
  const caminhaoIdValue = watch('caminhaoId')

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" noValidate>
      {/* Caminhão */}
      <div className="flex flex-col gap-1.5">
        <Select
          value={caminhaoIdValue ?? ''}
          onValueChange={(val) => setValue('caminhaoId', val)}
        >
          <SelectTrigger label="Caminhão">
            <SelectValue placeholder="Selecione o caminhão" />
          </SelectTrigger>
          <SelectContent>
            {caminhoes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.placa} — {c.modelo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.caminhaoId && (
          <p className="text-p-sm text-error-400">{errors.caminhaoId.message}</p>
        )}
      </div>

      {/* Origem / Destino */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Origem"
          placeholder="Sorriso/MT"
          error={errors.origem?.message}
          {...register('origem')}
        />
        <Input
          label="Destino"
          placeholder="Santos/SP"
          error={errors.destino?.message}
          {...register('destino')}
        />
      </div>

      {/* Tipo de carga */}
      <div className="flex flex-col gap-1.5">
        <Select
          value={tipoCargaValue ?? ''}
          onValueChange={(val) => setValue('tipoCarga', val as FreteCreateInput['tipoCarga'])}
        >
          <SelectTrigger label="Tipo de carga">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grao">Grão</SelectItem>
            <SelectItem value="oleo_soja">Óleo de soja</SelectItem>
            <SelectItem value="farelo">Farelo</SelectItem>
            <SelectItem value="fertilizante">Fertilizante</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
        {errors.tipoCarga && (
          <p className="text-p-sm text-error-400">{errors.tipoCarga.message}</p>
        )}
      </div>

      {/* KM Inicial / Valor bruto */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="KM inicial"
          type="number"
          placeholder="1200"
          error={errors.kmInicial?.message}
          {...register('kmInicial', { valueAsNumber: true })}
        />
        <Input
          label="Valor bruto (R$)"
          type="number"
          step="0.01"
          placeholder="18500.00"
          error={errors.valorBruto?.message}
          {...register('valorBruto', {
            setValueAs: (v) => (v === '' ? 0 : Math.round(parseFloat(v) * 100)),
          })}
        />
      </div>

      {/* Data início */}
      <Input
        label="Data de início"
        type="datetime-local"
        error={errors.dataInicio?.message}
        {...register('dataInicio', {
          setValueAs: (v) => v ? new Date(v).toISOString() : '',
        })}
      />

      <Button type="submit" disabled={isLoading} className="mt-2">
        {isLoading ? 'Salvando...' : 'Registrar frete'}
      </Button>
    </form>
  )
}
