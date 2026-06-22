// components/frota/MotoristaModal.tsx — Create/Edit driver modal
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
import { motoristaCreateSchema, type MotoristaCreateInput } from '@/lib/fleet/schemas'
import type { Motorista } from '@/types/frota'

interface MotoristaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  motorista?: Motorista | null         // present when editing
  onSubmit: (data: MotoristaCreateInput) => Promise<void>
  isLoading?: boolean
}

export function MotoristaModal({ open, onOpenChange, motorista, onSubmit, isLoading }: MotoristaModalProps) {
  const isEditing = !!motorista

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MotoristaCreateInput>({
    resolver: zodResolver(motoristaCreateSchema),
    defaultValues: {
      nome:               motorista?.nome ?? '',
      whatsapp:           motorista?.whatsapp ?? '',
      percentualComissao: motorista?.percentualComissao ?? 10,
      tipoContrato:       motorista?.tipoContrato ?? 'autonomo',
      cpf:                motorista?.cpf ?? '',
    },
  })

  // Reset form when modal opens or motorista changes
  useEffect(() => {
    if (open) {
      reset({
        nome:               motorista?.nome ?? '',
        whatsapp:           motorista?.whatsapp ?? '',
        percentualComissao: motorista?.percentualComissao ?? 10,
        tipoContrato:       motorista?.tipoContrato ?? 'autonomo',
        cpf:                motorista?.cpf ?? '',
      })
    }
  }, [open, motorista, reset])

  const tipoContratoValue = watch('tipoContrato')

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Motorista' : 'Novo Motorista'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do motorista.'
              : 'Preencha os dados para cadastrar um novo motorista. Um convite será enviado via WhatsApp.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Nome completo"
            placeholder="Carlos Silva"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="WhatsApp"
            placeholder="(65) 99999-0000"
            type="tel"
            error={errors.whatsapp?.message}
            {...register('whatsapp')}
          />

          <Input
            label="CPF (opcional)"
            placeholder="000.000.000-00"
            error={errors.cpf?.message}
            {...register('cpf')}
          />

          <Input
            label="Percentual de comissão (%)"
            type="number"
            min={0}
            max={100}
            placeholder="10"
            error={errors.percentualComissao?.message}
            {...register('percentualComissao', { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1.5">
            <Select
              value={tipoContratoValue ?? 'autonomo'}
              onValueChange={(val) => setValue('tipoContrato', val as MotoristaCreateInput['tipoContrato'])}
            >
              <SelectTrigger label="Tipo de contrato">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autonomo">Autônomo</SelectItem>
                <SelectItem value="clt">CLT</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipoContrato && (
              <p className="text-p-sm text-error-400">{errors.tipoContrato.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar motorista'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
