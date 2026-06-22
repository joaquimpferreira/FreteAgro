// app/(dashboard)/fretes/[id]/page.tsx — Freight detail page
// "use client" — manages status transitions and expense list interactively

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/fretes/StatusBadge'
import { LancamentoForm } from '@/components/fretes/LancamentoForm'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import { useFreteLancamentos } from '@/hooks/useFretes'
import type { Frete } from '@/types/frete'
import type { LancamentoCreateInput } from '@/lib/fretes/schemas'

const STATUS_NEXT_LABEL: Record<string, string> = {
  em_andamento:    'Concluir frete',
  concluido:       'Abrir acerto',
  acerto_pendente: 'Ver acerto',
}

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

export default function FreteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [frete, setFrete]             = useState<(Frete & { totalDespesas: number }) | null>(null)
  const [loadingFrete, setLoadingFrete] = useState(true)
  const [advancing, setAdvancing]     = useState(false)
  const [isSavingLancamento, setIsSavingLancamento] = useState(false)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const [showLancamentoForm, setShowLancamentoForm] = useState(false)

  // ── KM final dialog state ─────────────────────────────────────────────────
  const [kmDialogOpen, setKmDialogOpen] = useState(false)
  const [kmInputValue, setKmInputValue] = useState('')
  const [kmError, setKmError]           = useState<string | null>(null)
  const kmInputRef = useRef<HTMLInputElement>(null)

  const { data: lancamentosData, addLancamento, uploadFoto } = useFreteLancamentos(id)

  // Load freight details
  useEffect(() => {
    if (!id) return
    setLoadingFrete(true)
    fetch(`/api/fretes/${id}`)
      .then((r) => r.json())
      .then(setFrete)
      .catch(() => setErrorMsg('Erro ao carregar frete.'))
      .finally(() => setLoadingFrete(false))
  }, [id])

  async function handleAdvanceStatus() {
    if (!frete) return

    // acerto_pendente → navigate to acertos list
    if (frete.status === 'acerto_pendente') {
      router.push(`/acertos`)
      return
    }

    // "Abrir acerto": frete is concluido → create Acerto via POST /api/acertos
    if (frete.status === 'concluido') {
      setAdvancing(true)
      setErrorMsg(null)
      try {
        const res = await fetch('/api/acertos', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ freteId: frete.id }),
        })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b?.message ?? 'Erro ao abrir acerto.')
        }
        const acerto = await res.json()
        router.push(`/acertos/${acerto.motoristaId}`)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido.')
      } finally {
        setAdvancing(false)
      }
      return
    }

    // Concluding a freight: open KM dialog instead of prompt()
    if (frete.status === 'em_andamento') {
      setKmInputValue('')
      setKmError(null)
      setKmDialogOpen(true)
    }
  }

  async function handleConfirmKm() {
    if (!frete) return
    const kmFinal = parseInt(kmInputValue, 10)
    if (isNaN(kmFinal) || kmFinal < frete.kmInicial) {
      setKmError(`KM final deve ser maior ou igual ao KM inicial (${frete.kmInicial}).`)
      kmInputRef.current?.focus()
      return
    }

    setKmDialogOpen(false)
    setAdvancing(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/fretes/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status: 'concluido',
          kmFinal,
          dataFim: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b?.message ?? 'Erro ao avançar status.')
      }
      setFrete(await res.json())
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setAdvancing(false)
    }
  }

  async function handleAddLancamento(data: LancamentoCreateInput) {
    setIsSavingLancamento(true)
    setErrorMsg(null)
    try {
      await addLancamento(data)
      setShowLancamentoForm(false)
      const res = await fetch(`/api/fretes/${id}`)
      if (res.ok) setFrete(await res.json())
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao adicionar despesa.')
      throw err
    } finally {
      setIsSavingLancamento(false)
    }
  }

  if (loadingFrete) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  if (!frete) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-muted-foreground">Frete não encontrado.</p>
        <Button variant="outline" asChild>
          <Link href="/fretes">Voltar à lista</Link>
        </Button>
      </div>
    )
  }

  const nextActionLabel = STATUS_NEXT_LABEL[frete.status]

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── KM final dialog ──────────────────────────────────────────────── */}
      <Dialog open={kmDialogOpen} onOpenChange={setKmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir frete</DialogTitle>
            <DialogDescription>
              Informe o KM final para registrar a quilometragem percorrida.
              KM inicial: <span className="font-semibold text-foreground">{frete.kmInicial}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <Label htmlFor="km-final">KM final</Label>
            <Input
              id="km-final"
              ref={kmInputRef}
              type="number"
              placeholder={`Mínimo ${frete.kmInicial}`}
              value={kmInputValue}
              onChange={(e) => { setKmInputValue(e.target.value); setKmError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmKm()}
              autoFocus
              min={frete.kmInicial}
            />
            {kmError && (
              <p className="text-sm text-destructive">{kmError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setKmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmKm} disabled={!kmInputValue}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Voltar">
          <Link href="/fretes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">
              {frete.origem} → {frete.destino}
            </h1>
            <StatusBadge status={frete.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(frete.dataInicio).toLocaleDateString('pt-BR')}
            {frete.dataFim && ` — ${new Date(frete.dataFim).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricItem label="Valor bruto" value={formatMoeda(frete.valorBruto)} />
        <MetricItem label="Total despesas" value={formatMoeda(frete.totalDespesas)} valueClass="text-destructive" />
        <MetricItem label="KM inicial" value={String(frete.kmInicial)} />
        <MetricItem label="KM final" value={frete.kmFinal ? String(frete.kmFinal) : '—'} />
      </div>

      {/* Status action */}
      {nextActionLabel && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Próxima ação para este frete
          </p>
          <Button onClick={handleAdvanceStatus} disabled={advancing} size="sm">
            {advancing ? 'Aguarde...' : nextActionLabel}
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Expenses */}
      <section aria-labelledby="lancamentos-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 id="lancamentos-heading" className="text-base font-semibold text-foreground">
              Despesas
            </h2>
            {lancamentosData && (
              <Badge variant="outline">{lancamentosData.pagination.total}</Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowLancamentoForm((v) => !v)}>
            {showLancamentoForm ? 'Cancelar' : '+ Adicionar'}
          </Button>
        </div>

        {/* Add expense form */}
        {showLancamentoForm && (
          <div className="mb-4 rounded-lg border border-border bg-card p-5">
            <LancamentoForm
              onSubmit={handleAddLancamento}
              onUploadFoto={uploadFoto}
              isLoading={isSavingLancamento}
            />
          </div>
        )}

        {/* List */}
        {!lancamentosData?.data.length ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma despesa registrada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lancamentosData.data.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {TIPO_LABELS[l.tipo] ?? l.tipo}
                    {l.deducaoAcerto && (
                      <Badge variant="warning" className="ml-2 text-xs">Deduz acerto</Badge>
                    )}
                  </p>
                  {l.descricao && <p className="text-sm text-muted-foreground truncate">{l.descricao}</p>}
                </div>
                <p className="text-sm font-medium text-destructive shrink-0">
                  {formatMoeda(l.valor)}
                </p>
                {l.fotoUrl && (
                  <a
                    href={l.fotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                    aria-label="Ver nota fiscal"
                  >
                    <Receipt className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </a>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-destructive">
                {formatMoeda(lancamentosData.totalDespesas)}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function MetricItem({ label, value, valueClass = 'text-foreground' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}
