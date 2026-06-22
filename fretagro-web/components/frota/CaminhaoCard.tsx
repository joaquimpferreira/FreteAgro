// components/frota/CaminhaoCard.tsx — Truck card for the fleet list
// "use client" — renders action buttons with event handlers

'use client'

import Link from 'next/link'
import { Truck, UserCheck, AlertCircle, Pencil, Trash2, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Caminhao } from '@/types/frota'

interface CaminhaoCardProps {
  caminhao: Caminhao
  onEdit: (caminhao: Caminhao) => void
  onDelete: (caminhao: Caminhao) => void
  onBindDriver: (caminhao: Caminhao) => void
}

const CARROCERIA_LABELS: Record<string, string> = {
  graneleiro: 'Graneleiro',
  tanque:     'Tanque',
  bau:        'Baú',
  plataforma: 'Plataforma',
  outro:      'Outro',
}

export function CaminhaoCard({ caminhao, onEdit, onDelete, onBindDriver }: CaminhaoCardProps) {
  const semMotorista = caminhao.status === 'ativo' && !caminhao.motoristaId

  return (
    <div className="group rounded-card border border-grey-700 bg-surface-card flex flex-col gap-0 overflow-hidden">
      {/* Clickable info area */}
      <Link
        href={`/frota/${caminhao.id}`}
        className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grey-800">
              <Truck className="h-5 w-5 text-grey-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-p-md font-semibold text-grey-50 truncate">{caminhao.placa}</p>
              <p className="text-p-sm text-grey-400 truncate">{caminhao.modelo}</p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={caminhao.status === 'ativo'
              ? 'border-success-400/40 bg-success-400/10 text-success-300'
              : undefined}
          >
            {caminhao.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2 text-p-sm text-grey-400">
          {caminhao.ano && <span>Ano {caminhao.ano}</span>}
          {caminhao.carroceria && <span>· {CARROCERIA_LABELS[caminhao.carroceria] ?? caminhao.carroceria}</span>}
        </div>

        {/* Driver info */}
        {caminhao.motorista ? (
          <div className="flex items-center gap-2 rounded-input border border-grey-700 bg-surface-elevated px-3 py-2">
            <UserCheck className="h-4 w-4 text-primary-400 shrink-0" aria-hidden="true" />
            <p className="text-p-sm text-grey-200 truncate">{caminhao.motorista.nome}</p>
          </div>
        ) : semMotorista ? (
          <div className="flex items-center gap-2 rounded-input border border-warning-400/30 bg-warning-400/10 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-warning-400 shrink-0" aria-hidden="true" />
            <p className="text-p-sm text-warning-300">Sem motorista vinculado</p>
          </div>
        ) : null}
      </Link>

      {/* Action buttons — outside the Link so clicks don't navigate */}
      <div className="flex items-center gap-1 border-t border-grey-700 px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar caminhão"
          onClick={() => onEdit(caminhao)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Vincular motorista"
          onClick={() => onBindDriver(caminhao)}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Inativar caminhão"
          className="ml-auto"
          onClick={() => onDelete(caminhao)}
        >
          <Trash2 className="h-4 w-4 text-error-400" />
        </Button>
      </div>
    </div>
  )
}
