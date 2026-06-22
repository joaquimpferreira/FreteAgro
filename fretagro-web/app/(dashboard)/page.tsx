// app/(dashboard)/page.tsx — Dashboard root with KPIs, alerts, charts, and recent freights
// Server Component — fetches fleet stats server-side; first-access shows guided welcome.
// US6 — FR-033, FR-034, FR-035, SC-005 · `export const revalidate = 300`

import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AlertaBanner } from '@/components/dashboard/AlertaBanner'
import { ReceitaDespesaChart } from '@/components/dashboard/ReceitaDespesaChart'
import { DespesasDonutChart } from '@/components/dashboard/DespesasDonutChart'
import { FretesRecentesTable } from '@/components/dashboard/FretesRecentesTable'
import { DashboardPeriodSelector } from '@/components/dashboard/DashboardPeriodSelector'
import { getDashboardData, resolvePeriod, type PeriodPreset } from '@/lib/dashboard/aggregates'
import { formatMoeda } from '@/lib/finance/formatMoeda'

// Revalidate KPIs every 5 minutes (SC-005)
export const revalidate = 300

const VALID_PRESETS = new Set<PeriodPreset>([
  'este_mes', 'mes_passado', 'ultimos_3_meses', 'este_ano', 'personalizado',
])

interface SearchParams {
  periodo?: string
  from?: string
  to?: string
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth() as any
  if (!session?.user) redirect('/login')

  const frotaId: string = session.user.frotaId

  // First-access detection (lightweight count)
  const [caminhaoCount, motoristaCount] = await Promise.all([
    prisma.caminhao.count({ where: { frotaId, status: 'ativo' } }),
    prisma.motorista.count({ where: { frotaId, status: 'ativo' } }),
  ])

  const isFirstAccess = caminhaoCount === 0 && motoristaCount === 0
  if (isFirstAccess) {
    return <GuidedWelcome userName={session.user.name ?? 'dono'} />
  }

  // Resolve period from search params (FR-035)
  const periodoParam = (
    VALID_PRESETS.has(searchParams.periodo as PeriodPreset)
      ? searchParams.periodo
      : 'este_mes'
  ) as PeriodPreset

  const period = resolvePeriod(periodoParam, searchParams.from, searchParams.to)
  const data   = await getDashboardData(frotaId, period)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* ── Alertas ────────────────────────────────────────────── */}
      <AlertaBanner
        acertosPendentes={data.alertas.acertosPendentes}
        caminhoesSemMotorista={data.alertas.caminhoesSemMotorista}
      />

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MetricCard
          label="Receita Bruta"
          value={formatMoeda(data.kpis.receitaBruta)}
          href="/caixa"
          trend={data.kpis.receitaBruta > 0 ? 'No período' : 'Sem receita'}
          trendUp={data.kpis.receitaBruta > 0}
          description="Total recebido no período"
          sublabel="Fretes concluídos e acertos"
        />
        <MetricCard
          label="Total de Fretes"
          value={String(data.kpis.totalFretes)}
          href="/fretes"
          trend={data.kpis.totalFretes > 0 ? `${data.kpis.totalFretes} fretes` : 'Sem fretes'}
          trendUp={data.kpis.totalFretes > 0}
          description="Fretes no período"
          sublabel="Em andamento e concluídos"
        />
        <MetricCard
          label="Despesas Totais"
          value={formatMoeda(data.kpis.despesasTotais)}
          href="/caixa"
          trend={data.kpis.despesasTotais > 0 ? 'No período' : 'Sem saídas'}
          trendUp={false}
          description="Total de saídas no período"
          sublabel="Manutenção, combustível e outros"
        />
        <MetricCard
          label="Lucro Líquido"
          value={formatMoeda(data.kpis.lucroLiquido)}
          href="/caixa"
          trend={data.kpis.lucroLiquido >= 0 ? 'Positivo' : 'Negativo'}
          trendUp={data.kpis.lucroLiquido >= 0}
          description={data.kpis.lucroLiquido >= 0 ? 'Margem favorável' : 'Despesas acima da receita'}
          sublabel="Receita bruta menos despesas"
        />
      </div>

      {/* ── Gráfico principal ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Receita vs Despesa</CardTitle>
              <CardDescription>Evolução mensal no período selecionado</CardDescription>
            </div>
            <DashboardPeriodSelector
              currentPeriodo={periodoParam}
              from={searchParams.from}
              to={searchParams.to}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ReceitaDespesaChart data={data.receitaDespesaPorMes} />
        </CardContent>
      </Card>

      {/* ── Segunda linha: Donut | Fretes Recentes ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Composição de Despesas</CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <DespesasDonutChart data={data.despesasPorCategoria} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fretes Recentes</CardTitle>
                <CardDescription>Últimos fretes registrados</CardDescription>
              </div>
              <Link href="/fretes" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <FretesRecentesTable fretes={data.fretesRecentes} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Guided Welcome — shown on first access (FR-014) ─────────────────────────

function GuidedWelcome({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2 font-semibold text-grey-50">
          Bem-vindo ao FreteAgro, {userName.split(' ')[0]}!
        </h1>
        <p className="mt-2 text-p-md text-grey-400">
          Siga os passos abaixo para começar a gerenciar sua frota.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SetupCard
          step={1}
          title="Cadastre um caminhão"
          description="Adicione o primeiro veículo da frota para começar a registrar fretes."
          href="/frota"
          cta="Ir para Frota"
        />
        <SetupCard
          step={2}
          title="Cadastre um motorista"
          description="O motorista receberá um convite via WhatsApp para ativar o aplicativo."
          href="/frota"
          cta="Ir para Frota"
        />
      </div>

      <EmptyState
        title="Nenhum frete registrado ainda"
        description="Após cadastrar caminhão e motorista, você poderá registrar os primeiros fretes."
        icon={Package}
        action={
          <Link href="/fretes/novo">
            <Button variant="outline">Registrar frete</Button>
          </Link>
        }
      />
    </div>
  )
}

// ─── Setup Card ───────────────────────────────────────────────────────────────

interface SetupCardProps {
  step: number
  title: string
  description: string
  href: string
  cta: string
}

function SetupCard({ step, title, description, href, cta }: SetupCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-grey-700 bg-surface-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-400 text-p-sm font-bold text-grey-900">
          {step}
        </div>
        <h3 className="text-p-md font-semibold text-grey-100">{title}</h3>
      </div>
      <p className="text-p-sm text-grey-400">{description}</p>
      <Link href={href}>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          {cta}
        </Button>
      </Link>
    </div>
  )
}
