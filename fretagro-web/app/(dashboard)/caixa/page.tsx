// app/(dashboard)/caixa/page.tsx — Fleet cash-flow statement (US5)
// "use client" — manages period selector state and form dialog interactions
// FR-029, FR-030, FR-031, FR-032

'use client'

import { useState } from 'react'
import { PlusCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PeriodSelector, type PeriodOption, type DateRange } from '@/components/shared/PeriodSelector'
import { ExtratoTable } from '@/components/dashboard/ExtratoTable'
import { LancamentoAvulsoForm } from '@/components/dashboard/LancamentoAvulsoForm'
import { ComposicaoDespesas } from '@/components/dashboard/ComposicaoDespesas'
import { formatMoeda } from '@/lib/finance/formatMoeda'
import { useCaixa } from '@/hooks/useCaixa'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// ─── Default period: current month ────────────────────────────────────────────

function getDefaultRange(): DateRange {
  const now = new Date()
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to:   format(endOfMonth(now),   'yyyy-MM-dd'),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CaixaPage() {
  const [period, setPeriod]         = useState<PeriodOption>('this_month')
  const [dateRange, setDateRange]   = useState<DateRange>(getDefaultRange)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving]         = useState(false)

  const { data, loading, error, addLancamentoAvulso } = useCaixa({
    from: dateRange.from,
    to:   dateRange.to,
  })

  function handlePeriodChange(opt: PeriodOption, range: DateRange) {
    setPeriod(opt)
    setDateRange(range)
  }

  async function handleAddLancamento(input: Parameters<typeof addLancamentoAvulso>[0]) {
    setSaving(true)
    try {
      await addLancamentoAvulso(input)
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const isLucro = (data?.lucroLiquido ?? 0) >= 0

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Caixa da Frota</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fluxo de caixa, receitas e despesas por período
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Period selector */}
          <PeriodSelector
            value={period}
            onChange={handlePeriodChange}
            className="w-44"
          />

          {/* Add manual outflow */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Nova Saída
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Saída Avulsa</DialogTitle>
              </DialogHeader>
              <LancamentoAvulsoForm
                onSubmit={handleAddLancamento}
                onCancel={() => setDialogOpen(false)}
                isLoading={saving}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Loading / Error ──────────────────────────────────────────────────── */}
      {loading && <LoadingSpinner />}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* ── KPI: Lucro Líquido ───────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Receitas KPI */}
            <Card className="bg-gradient-to-t from-emerald-500/5 to-card">
              <CardHeader className="pb-2">
                <CardDescription>Total Receitas</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums text-emerald-400">
                  {formatMoeda(data.receitas.total)}
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1 text-emerald-400" />
                Entradas do período
              </CardFooter>
            </Card>

            {/* Despesas KPI */}
            <Card className="bg-gradient-to-t from-orange-500/5 to-card">
              <CardHeader className="pb-2">
                <CardDescription>Total Despesas</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums text-orange-400">
                  {formatMoeda(data.totalDespesas)}
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 mr-1 text-orange-400" />
                Saídas do período
              </CardFooter>
            </Card>

            {/* Lucro Líquido KPI */}
            <Card className={`bg-gradient-to-t to-card ${
              isLucro ? 'from-emerald-500/5' : 'from-destructive/5'
            }`}>
              <CardHeader className="pb-2">
                <CardDescription>Lucro Líquido</CardDescription>
                <CardTitle
                  className={`text-2xl font-semibold tabular-nums ${
                    isLucro ? 'text-emerald-400' : 'text-destructive'
                  }`}
                  data-testid="lucro-liquido"
                >
                  {formatMoeda(data.lucroLiquido)}
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                {isLucro
                  ? <TrendingUp  className="h-4 w-4 mr-1 text-emerald-400" />
                  : <TrendingDown className="h-4 w-4 mr-1 text-destructive" />}
                {isLucro ? 'Margem favorável' : 'Despesas acima da receita'}
              </CardFooter>
            </Card>
          </div>

          {/* ── Main statement ────────────────────────────────────────────────── */}
          <ExtratoTable
            receitas={data.receitas}
            despesasPorCategoria={data.despesasPorCategoria}
            totalDespesas={data.totalDespesas}
            lucroLiquido={data.lucroLiquido}
          />

          {/* ── Expense composition ───────────────────────────────────────────── */}
          <ComposicaoDespesas
            despesasPorCategoria={data.despesasPorCategoria}
            totalDespesas={data.totalDespesas}
          />
        </>
      )}
    </div>
  )
}
