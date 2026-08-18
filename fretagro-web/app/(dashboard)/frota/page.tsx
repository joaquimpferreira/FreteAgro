// app/(dashboard)/frota/page.tsx — Fleet management page
// "use client" — manages truck/driver lists with modals and real-time actions

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CaminhaoCard } from '@/components/frota/CaminhaoCard'
import { CaminhaoModal } from '@/components/frota/CaminhaoModal'
import { MotoristaModal } from '@/components/frota/MotoristaModal'
import { VincularMotoristaModal } from '@/components/frota/VincularMotoristaModal'
import { FrotaEmptyState } from '@/components/frota/FrotaEmptyState'
import { FrotaOverviewStats } from '@/components/frota/FrotaOverviewStats'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useCaminhoes, useMotoristas } from '@/hooks/useFrota'
import type { Caminhao, Motorista } from '@/types/frota'
import type { CaminhaoCreateInput, MotoristaCreateInput } from '@/lib/fleet/schemas'

export default function FrotaPage() {
  // ─── Truck state ──────────────────────────────────────────────────────────
  const {
    data: caminhoesData,
    loading: caminhoesLoading,
    createCaminhao,
    updateCaminhao,
    deleteCaminhao,
  } = useCaminhoes()

  const {
    data: caminhoesSemMotorista,
  } = useCaminhoes({ semMotorista: true })

  // ─── Driver state ─────────────────────────────────────────────────────────
  const {
    data: motoristasData,
    loading: motoristasLoading,
    createMotorista,
    updateMotorista,
    deleteMotorista,
    resendInvite,
  } = useMotoristas()

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [caminhaoModalOpen, setCaminhaoModalOpen] = useState(false)
  const [motoristaModalOpen, setMotoristaModalOpen] = useState(false)
  const [vincularModalOpen, setVincularModalOpen] = useState(false)
  const [editingCaminhao, setEditingCaminhao] = useState<Caminhao | null>(null)
  const [editingMotorista, setEditingMotorista] = useState<Motorista | null>(null)
  const [bindingCaminhao, setBindingCaminhao] = useState<Caminhao | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─── Handlers: Trucks ────────────────────────────────────────────────────

  function handleNewCaminhao() {
    setEditingCaminhao(null)
    setCaminhaoModalOpen(true)
  }

  function handleEditCaminhao(caminhao: Caminhao) {
    setEditingCaminhao(caminhao)
    setCaminhaoModalOpen(true)
  }

  async function handleSaveCaminhao(data: CaminhaoCreateInput) {
    setIsSaving(true)
    setErrorMsg(null)
    try {
      if (editingCaminhao) {
        await updateCaminhao(editingCaminhao.id, data)
      } else {
        await createCaminhao(data)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar caminhão.')
      throw err // re-throw so modal stays open
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCaminhao(caminhao: Caminhao) {
    if (!confirm(`Inativar o caminhão ${caminhao.placa}? Esta ação preserva o histórico.`)) return
    setErrorMsg(null)
    try {
      await deleteCaminhao(caminhao.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao inativar caminhão.')
    }
  }

  // ─── Handlers: Bind driver ────────────────────────────────────────────────

  function handleBindDriver(caminhao: Caminhao) {
    setBindingCaminhao(caminhao)
    setVincularModalOpen(true)
  }

  async function handleVincular(caminhaoId: string, motoristaId: string | null) {
    setErrorMsg(null)
    try {
      await updateCaminhao(caminhaoId, { motoristaId: motoristaId ?? null })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao vincular motorista.')
      throw err
    } finally {
      setBindingCaminhao(null)
    }
  }

  // ─── Handlers: Drivers ────────────────────────────────────────────────────

  function handleNewMotorista() {
    setEditingMotorista(null)
    setMotoristaModalOpen(true)
  }

  function handleEditMotorista(motorista: Motorista) {
    setEditingMotorista(motorista)
    setMotoristaModalOpen(true)
  }

  async function handleSaveMotorista(data: MotoristaCreateInput) {
    setIsSaving(true)
    setErrorMsg(null)
    try {
      if (editingMotorista) {
        await updateMotorista(editingMotorista.id, data)
      } else {
        await createMotorista(data)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar motorista.')
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteMotorista(motorista: Motorista) {
    if (!confirm(`Inativar o motorista ${motorista.nome}? Esta ação preserva o histórico.`)) return
    setErrorMsg(null)
    try {
      await deleteMotorista(motorista.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao inativar motorista.')
    }
  }

  // ─── Alert: trucks without driver ────────────────────────────────────────

  const semMotoristaCount = caminhoesSemMotorista?.pagination.total ?? 0

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Frota</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie caminhões e motoristas</p>
        </div>
      </div>

      {/* Alert: sem motorista (FR-015) */}
      {semMotoristaCount > 0 && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-400" aria-hidden="true" />
          <p className="text-sm text-yellow-300">
            {semMotoristaCount === 1
              ? '1 caminhão ativo sem motorista vinculado.'
              : `${semMotoristaCount} caminhões ativos sem motorista vinculado.`}
          </p>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* ─── Analytics da frota ──────────────────────────────────── */}
      <FrotaOverviewStats />

      {/* ─── Trucks section ─────────────────────────────────────── */}
      <section aria-labelledby="caminhoes-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 id="caminhoes-heading" className="text-base font-semibold text-foreground">
              Caminhões
            </h2>
            {caminhoesData && (
              <Badge variant="outline">{caminhoesData.pagination.total}</Badge>
            )}
          </div>
          <Button size="sm" onClick={handleNewCaminhao} aria-label="Adicionar caminhão">
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Adicionar
          </Button>
        </div>

        {caminhoesLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !caminhoesData?.data.length ? (
          <FrotaEmptyState
            type="caminhoes"
            action={
              <Button size="sm" onClick={handleNewCaminhao}>
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Adicionar caminhão
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caminhoesData.data.map((caminhao) => (
              <CaminhaoCard
                key={caminhao.id}
                caminhao={caminhao}
                onEdit={handleEditCaminhao}
                onDelete={handleDeleteCaminhao}
                onBindDriver={handleBindDriver}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Drivers section ────────────────────────────────────── */}
      <section aria-labelledby="motoristas-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 id="motoristas-heading" className="text-base font-semibold text-foreground">
              Motoristas
            </h2>
            {motoristasData && (
              <Badge variant="outline">{motoristasData.pagination.total}</Badge>
            )}
          </div>
          <Button size="sm" onClick={handleNewMotorista} aria-label="Adicionar motorista">
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            Adicionar
          </Button>
        </div>

        {motoristasLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !motoristasData?.data.length ? (
          <FrotaEmptyState
            type="motoristas"
            action={
              <Button size="sm" onClick={handleNewMotorista}>
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Adicionar motorista
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {motoristasData.data.map((motorista) => (
              <MotoristaRow
                key={motorista.id}
                motorista={motorista}
                onEdit={handleEditMotorista}
                onDelete={handleDeleteMotorista}
                onResendInvite={resendInvite}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Modals ──────────────────────────────────────────────── */}
      <CaminhaoModal
        open={caminhaoModalOpen}
        onOpenChange={setCaminhaoModalOpen}
        caminhao={editingCaminhao}
        onSubmit={handleSaveCaminhao}
        isLoading={isSaving}
      />
      <MotoristaModal
        open={motoristaModalOpen}
        onOpenChange={setMotoristaModalOpen}
        motorista={editingMotorista}
        onSubmit={handleSaveMotorista}
        isLoading={isSaving}
      />
      <VincularMotoristaModal
        open={vincularModalOpen}
        onOpenChange={setVincularModalOpen}
        caminhao={bindingCaminhao}
        motoristas={motoristasData?.data ?? []}
        onVincular={handleVincular}
      />
    </div>
  )
}

// ─── Inline driver row (simple list item) ────────────────────────────────────

interface MotoristaRowProps {
  motorista: Motorista
  onEdit: (motorista: Motorista) => void
  onDelete: (motorista: Motorista) => void
  onResendInvite: (id: string) => Promise<void>
}

function MotoristaRow({ motorista, onEdit, onDelete, onResendInvite }: MotoristaRowProps) {
  return (
    <div className="group rounded-card border border-grey-700 bg-surface-card flex flex-col gap-0 overflow-hidden">
      {/* Clickable info area */}
      <Link
        href={`/frota/motoristas/${motorista.id}`}
        className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-p-md font-semibold text-grey-50 truncate">{motorista.nome}</p>
            <p className="text-p-sm text-grey-400 truncate">{motorista.whatsapp}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className={motorista.status === 'ativo'
                ? 'border-success-400/40 bg-success-400/10 text-success-300'
                : undefined}
            >
              {motorista.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
            {!motorista.appAtivado && (
              <Badge variant="outline" className="border-warning-400/40 bg-warning-400/10 text-warning-300">
                App pendente
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-p-sm text-grey-400">
          <span>{motorista.percentualComissao}% comissão</span>
          <span>· {motorista.tipoContrato === 'clt' ? 'CLT' : 'Autônomo'}</span>
          {motorista.caminhao && (
            <span className="text-primary-400">· Caminhão: {motorista.caminhao.placa}</span>
          )}
        </div>
      </Link>

      {/* Action buttons — outside the Link */}
      <div className="flex items-center gap-2 border-t border-grey-700 px-3 py-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(motorista)}>
          Editar
        </Button>
        {!motorista.appAtivado && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onResendInvite(motorista.id).catch(() => {})}
          >
            Reenviar convite
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-error-400 hover:text-error-300 ml-auto"
          onClick={() => onDelete(motorista)}
        >
          Inativar
        </Button>
      </div>
    </div>
  )
}
