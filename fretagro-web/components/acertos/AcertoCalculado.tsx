// components/acertos/AcertoCalculado.tsx — displays the settlement breakdown
// "use client" — interactive (confirm button, receipt generation)

'use client'

import { useState } from 'react'
import { CheckCircle, FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import type { AcertoDetalhe } from '@/hooks/useAcertos'

const STATUS_LABELS: Record<string, string> = {
  pendente:  'Pendente',
  realizado: 'Realizado',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente:  'secondary',
  realizado: 'default',
}

interface AcertoCalculadoProps {
  acerto: AcertoDetalhe
  onConfirm?: (id: string) => Promise<void>
  onGerarComprovante?: (id: string) => Promise<string>
}

export function AcertoCalculado({
  acerto,
  onConfirm,
  onGerarComprovante,
}: AcertoCalculadoProps) {
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [pdfLoading, setPdfLoading]         = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(
    acerto.comprovanteUrl ?? null,
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!onConfirm) return
    setConfirmLoading(true)
    setErrorMsg(null)
    try {
      await onConfirm(acerto.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao confirmar acerto.')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handlePdf = async () => {
    if (!onGerarComprovante) return
    setPdfLoading(true)
    setErrorMsg(null)
    try {
      const url = await onGerarComprovante(acerto.id)
      setComprovanteUrl(url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao gerar comprovante.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="rounded-card border border-grey-700 bg-surface-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-p-md font-semibold text-grey-50">
            {acerto.motorista.nome}
          </p>
          <p className="text-p-sm text-grey-400">
            {acerto.frete.origem} → {acerto.frete.destino}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[acerto.status] ?? 'outline'}>
          {STATUS_LABELS[acerto.status] ?? acerto.status}
        </Badge>
      </div>

      {/* Breakdown */}
      <div className="rounded-input bg-surface-elevated px-4 py-3 flex flex-col gap-2 text-p-sm">
        <div className="flex justify-between text-grey-300">
          <span>Valor bruto do frete</span>
          <span className="font-medium text-grey-50">{formatMoeda(acerto.valorFrete)}</span>
        </div>

        <div className="flex justify-between text-grey-300">
          <span>Comissão ({acerto.percentualComissao}%)</span>
          <span className="font-medium text-brand-green">{formatMoeda(acerto.valorComissao)}</span>
        </div>

        {/* Deductions */}
        {acerto.frete.lancamentos && acerto.frete.lancamentos.length > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-caption text-grey-500 uppercase tracking-wide">Deduções</p>
            {acerto.frete.lancamentos.map((d) => (
              <div key={d.id} className="flex justify-between text-grey-400">
                <span>
                  {d.tipo}{d.descricao ? ` — ${d.descricao}` : ''}
                </span>
                <span className="text-brand-orange">({formatMoeda(d.valor)})</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between text-grey-300">
          <span>Total de deduções</span>
          <span className="font-medium text-brand-orange">({formatMoeda(acerto.totalDeducoes)})</span>
        </div>

        <div className="mt-1 flex justify-between border-t border-grey-700 pt-2">
          <span className="font-semibold text-grey-50">Saldo final</span>
          <span className={`font-bold text-lg ${acerto.saldoFinal >= 0 ? 'text-brand-green' : 'text-error'}`}>
            {formatMoeda(acerto.saldoFinal)}
          </span>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="text-p-sm text-error">{errorMsg}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {acerto.status === 'pendente' && onConfirm && (
          <Button
            onClick={handleConfirm}
            disabled={confirmLoading}
            className="flex-1"
          >
            {confirmLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Confirmar Pagamento
          </Button>
        )}

        {onGerarComprovante && (
          <Button
            variant="outline"
            onClick={handlePdf}
            disabled={pdfLoading}
            className="flex-1"
          >
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {comprovanteUrl ? 'Baixar Comprovante' : 'Gerar Comprovante'}
          </Button>
        )}
      </div>
    </div>
  )
}
