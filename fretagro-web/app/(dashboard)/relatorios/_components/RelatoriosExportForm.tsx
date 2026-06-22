// app/(dashboard)/relatorios/_components/RelatoriosExportForm.tsx
// "use client" — handles form submission and triggers file download via fetch.
// US6 — FR-036 · Period picker + format selector + download button.

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'

export function RelatoriosExportForm() {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = `${today.slice(0, 7)}-01`

  const [from, setFrom]       = useState(firstOfMonth)
  const [to, setTo]           = useState(today)
  const [formato, setFormato] = useState<'pdf' | 'excel'>('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleExport() {
    if (!from || !to) {
      setError('Selecione o período inicial e final.')
      return
    }
    if (from > to) {
      setError('A data inicial não pode ser posterior à final.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ formato, from, to })
      const res = await fetch(`/api/relatorios?${params}`)

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Erro ao gerar relatório.')
      }

      // Trigger browser download
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `relatorio-${from}-${to}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Period */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-p-xs font-medium text-grey-300">
            De
          </label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to}
            aria-label="Data inicial"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-p-xs font-medium text-grey-300">
            Até
          </label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from}
            max={today}
            aria-label="Data final"
          />
        </div>
      </div>

      {/* Format */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="formato" className="text-p-xs font-medium text-grey-300">
          Formato
        </label>
        <Select value={formato} onValueChange={(v) => setFormato(v as 'pdf' | 'excel')}>
          <SelectTrigger id="formato" aria-label="Selecionar formato">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-400" />
                PDF — para impressão
              </span>
            </SelectItem>
            <SelectItem value="excel">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-400" />
                Excel — para contador
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-p-xs text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        onClick={handleExport}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando relatório…
          </>
        ) : (
          <>
            {formato === 'pdf'
              ? <FileText className="mr-2 h-4 w-4" />
              : <FileSpreadsheet className="mr-2 h-4 w-4" />
            }
            Baixar {formato.toUpperCase()}
          </>
        )}
      </Button>
    </div>
  )
}
