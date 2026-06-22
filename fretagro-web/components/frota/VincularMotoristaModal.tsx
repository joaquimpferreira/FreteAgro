// components/frota/VincularMotoristaModal.tsx
// Modal para vincular/desvincular um motorista a um caminhão
// Mostra lista de motoristas por nome + WhatsApp (sem IDs)

'use client'

import { useState } from 'react'
import { UserCheck, UserX, Phone, Percent } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Caminhao, Motorista } from '@/types/frota'

interface VincularMotoristaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caminhao: Caminhao | null
  motoristas: Motorista[]
  isLoading?: boolean
  onVincular: (caminhaoId: string, motoristaId: string | null) => Promise<void>
}

export function VincularMotoristaModal({
  open,
  onOpenChange,
  caminhao,
  motoristas,
  isLoading,
  onVincular,
}: VincularMotoristaModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset selection when modal opens
  function handleOpenChange(value: boolean) {
    if (value) setSelectedId(null)
    onOpenChange(value)
  }

  // Motoristas disponíveis = ativos e sem caminhão (ou o já vinculado a este caminhão)
  const disponíveis = motoristas.filter(
    (m) => m.status === 'ativo' && (!m.caminhao || m.caminhao.id === caminhao?.id)
  )

  const motoristaAtual = caminhao?.motorista ?? null

  async function handleConfirm() {
    if (!caminhao) return
    setSaving(true)
    try {
      await onVincular(caminhao.id, selectedId)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDesvincular() {
    if (!caminhao) return
    setSaving(true)
    try {
      await onVincular(caminhao.id, null)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isBusy = saving || isLoading

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular motorista</DialogTitle>
          <DialogDescription>
            Selecione o motorista para o caminhão{' '}
            <span className="font-semibold text-foreground">{caminhao?.placa}</span>{' '}
            {caminhao?.modelo ? `· ${caminhao.modelo}` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Motorista atual */}
        {motoristaAtual && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 flex items-center gap-3">
            <UserCheck className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{motoristaAtual.nome}</p>
              <p className="text-xs text-muted-foreground">{motoristaAtual.whatsapp}</p>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs shrink-0">
              Atual
            </Badge>
          </div>
        )}

        {/* Lista de motoristas disponíveis */}
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {disponíveis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum motorista disponível para vincular.
            </p>
          ) : (
            disponíveis.map((m) => {
              const isSelected = selectedId === m.id
              const isAtual = motoristaAtual?.id === m.id

              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setSelectedId(isSelected ? null : m.id)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                    'flex items-center gap-3',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border bg-card hover:bg-accent hover:text-accent-foreground',
                    isAtual && !isSelected && 'opacity-60'
                  )}
                >
                  {/* Avatar inicial */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {m.nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.nome}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{m.whatsapp}</span>
                      <Percent className="h-3 w-3 shrink-0 ml-1" />
                      <span>{m.percentualComissao}%</span>
                    </div>
                  </div>

                  {/* Badge selecionado */}
                  {isSelected && (
                    <UserCheck className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {/* Desvincular (só aparece se há motorista atual) */}
          <div>
            {motoristaAtual && (
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={handleDesvincular}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                <UserX className="h-4 w-4 mr-1.5" />
                Desvincular
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" disabled={isBusy} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isBusy || !selectedId || selectedId === motoristaAtual?.id}
              onClick={handleConfirm}
            >
              {saving ? 'Salvando…' : 'Vincular'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
