// app/(dashboard)/relatorios/page.tsx — Financial reports export page (US6, FR-036)
// Server Component — renders period selector and PDF/Excel export buttons.
// Export triggers are client-side downloads via window.location.

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { FileText, FileSpreadsheet, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RelatoriosExportForm } from './_components/RelatoriosExportForm'

export const metadata = { title: 'Relatórios — FreteAgro' }

export default async function RelatoriosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth() as any
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'dono') redirect('/')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporte relatórios financeiros para contabilidade ou arquivo pessoal.
        </p>
      </div>

      {/* Export card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Download className="h-4 w-4 text-orange-400" />
            Exportar Relatório Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RelatoriosExportForm />
        </CardContent>
      </Card>

      {/* Info boxes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">PDF</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Relatório formatado com resumo, despesas por categoria e lista de fretes — ideal para impressão.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">Excel</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Planilha com 4 abas: resumo, receitas, despesas detalhadas e por categoria — ideal para contador.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
