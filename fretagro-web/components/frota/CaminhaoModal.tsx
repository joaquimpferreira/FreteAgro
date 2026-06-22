// components/frota/CaminhaoModal.tsx — Create/Edit truck modal
// "use client" — form with React Hook Form + interactive dialog

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { caminhaoCreateSchema, caminhaoUpdateSchema, type CaminhaoCreateInput } from '@/lib/fleet/schemas'
import type { Caminhao } from '@/types/frota'

interface CaminhaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caminhao?: Caminhao | null          // present when editing
  onSubmit: (data: CaminhaoCreateInput) => Promise<void>
  isLoading?: boolean
}

export function CaminhaoModal({ open, onOpenChange, caminhao, onSubmit, isLoading }: CaminhaoModalProps) {
  const isEditing = !!caminhao

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CaminhaoCreateInput>({
    resolver: zodResolver(isEditing ? caminhaoUpdateSchema : caminhaoCreateSchema),
    defaultValues: {
      placa:      caminhao?.placa ?? '',
      modelo:     caminhao?.modelo ?? '',
      ano:        caminhao?.ano ?? undefined,
      carroceria: caminhao?.carroceria ?? undefined,
    },
  })

  // Reset form when the modal closes or the caminhao changes
  useEffect(() => {
    if (open) {
      reset({
        placa:      caminhao?.placa ?? '',
        modelo:     caminhao?.modelo ?? '',
        ano:        caminhao?.ano ?? undefined,
        carroceria: caminhao?.carroceria ?? undefined,
      })
    }
  }, [open, caminhao, reset])

  const carroceriaValue = watch('carroceria')

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Caminhão' : 'Novo Caminhão'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do caminhão.' : 'Preencha os dados para cadastrar um novo caminhão.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Placa"
            placeholder="ABC1D23"
            error={errors.placa?.message}
            {...register('placa')}
          />

          <Input
            label="Modelo"
            placeholder="Scania R450"
            error={errors.modelo?.message}
            {...register('modelo')}
          />

          <Input
            label="Ano (opcional)"
            type="number"
            placeholder="2021"
            error={errors.ano?.message}
            {...register('ano', { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1.5">
            <Select
              value={carroceriaValue ?? ''}
              onValueChange={(val) => setValue('carroceria', val as CaminhaoCreateInput['carroceria'])}
            >
              <SelectTrigger label="Carroceria (opcional)">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graneleiro">Graneleiro</SelectItem>
                <SelectItem value="tanque">Tanque</SelectItem>
                <SelectItem value="bau">Baú</SelectItem>
                <SelectItem value="plataforma">Plataforma</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.carroceria && (
              <p className="text-p-sm text-error-400">{errors.carroceria.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar caminhão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
