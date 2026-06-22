// components/fretes/LancamentoForm.tsx — Add freight expense form
// "use client" — form with RHF, file upload, and live preview

'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { lancamentoCreateSchema, type LancamentoCreateInput } from '@/lib/fretes/schemas'

const TIPO_LABELS: Record<string, string> = {
  combustivel:  'Combustível',
  borracharia:  'Borracharia',
  patio:        'Pátio / estadia',
  pedagio:      'Pedágio',
  oficina:      'Oficina / manutenção',
  vale:         'Vale',
  adiantamento: 'Adiantamento',
  salario:      'Salário',
  ipva:         'IPVA',
  seguro:       'Seguro',
  outro:        'Outro',
}

interface LancamentoFormProps {
  onSubmit: (data: LancamentoCreateInput) => Promise<void>
  onUploadFoto: (file: File) => Promise<string>
  isLoading?: boolean
}

export function LancamentoForm({ onSubmit, onUploadFoto, isLoading }: LancamentoFormProps) {
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoUrl, setFotoUrl]             = useState<string | undefined>()
  const [fotoError, setFotoError]         = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LancamentoCreateInput>({
    resolver: zodResolver(lancamentoCreateSchema),
    defaultValues: { deducaoAcerto: false },
  })

  const tipoValue = watch('tipo')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoError(null)
    setUploadingFoto(true)
    try {
      const url = await onUploadFoto(file)
      setFotoUrl(url)
      setValue('fotoUrl', url)
    } catch (err) {
      setFotoError(err instanceof Error ? err.message : 'Erro ao fazer upload.')
    } finally {
      setUploadingFoto(false)
    }
  }

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit({ ...data, fotoUrl })
    reset()
    setFotoUrl(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  })

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" noValidate>
      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <Select
          value={tipoValue ?? ''}
          onValueChange={(val) => setValue('tipo', val as LancamentoCreateInput['tipo'])}
        >
          <SelectTrigger label="Tipo de despesa">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TIPO_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo && <p className="text-p-sm text-error-400">{errors.tipo.message}</p>}
      </div>

      {/* Valor */}
      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        placeholder="950.00"
        error={errors.valor?.message}
        {...register('valor', {
          setValueAs: (v) => (v === '' ? 0 : Math.round(parseFloat(v) * 100)),
        })}
      />

      {/* Descrição */}
      <Input
        label="Descrição (opcional)"
        placeholder="Posto BR Km 340"
        error={errors.descricao?.message}
        {...register('descricao')}
      />

      {/* Deducao acerto */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-grey-700 bg-surface-elevated accent-primary-400"
          {...register('deducaoAcerto')}
        />
        <span className="text-p-sm text-grey-300">Deduzir do acerto do motorista</span>
      </label>

      {/* Nota fiscal photo */}
      <div className="flex flex-col gap-1.5">
        <p className="text-p-sm font-medium text-grey-200">Nota fiscal (opcional)</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFoto}
          >
            <Paperclip className="h-4 w-4 mr-1" aria-hidden="true" />
            {uploadingFoto ? 'Enviando...' : fotoUrl ? 'Trocar foto' : 'Anexar foto'}
          </Button>
          {fotoUrl && <span className="text-p-sm text-primary-400 truncate max-w-xs">Foto anexada</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Nota fiscal"
        />
        {fotoError && <p className="text-p-sm text-error-400">{fotoError}</p>}
      </div>

      <Button type="submit" disabled={isLoading || uploadingFoto} className="mt-2">
        {isLoading ? 'Salvando...' : 'Adicionar despesa'}
      </Button>
    </form>
  )
}
