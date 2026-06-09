# Implementation Plan: FreteAgro — Plataforma SaaS para Gestão de Frota Agrícola

**Branch**: `001-frete-agro-saas` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-frete-agro-saas/spec.md`

## Summary

FreteAgro is a multi-tenant SaaS that digitizes operational and financial control of agricultural freight fleets. The fleet owner (`dono`) uses a responsive Next.js web panel to manage trucks, drivers, freights, expenses, driver settlements (`acertos`), cash flow, dashboards, and reports. Drivers use a separate React Native (Expo) mobile app — in its own repository — to register trips and expenses with offline support. This plan covers the **web platform** (`fretagro-web`).

Technical approach: Next.js 14 App Router with Server Components by default, Prisma over Supabase PostgreSQL, Supabase Auth bridged into Next-Auth v5, Tailwind + Shadcn/UI customized for the dark theme, React Hook Form + Zod for forms, Recharts for dashboards, and jsPDF/xlsx for receipts and reports. All monetary values are stored as integer centavos; financial logic is isolated in `lib/finance/`; multi-tenancy is enforced via Supabase RLS plus `lib/` guards.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS

**Primary Dependencies**: Next.js 14+ (App Router), React 18, Tailwind CSS, Shadcn/UI, React Hook Form, Zod, Recharts, Prisma ORM, Next-Auth v5 (Auth.js), Supabase JS client (`@supabase/supabase-js`, `@supabase/ssr`), jsPDF, xlsx (SheetJS), date-fns

**Storage**: Supabase PostgreSQL (relational data via Prisma); Supabase Storage (nota fiscal photos + generated PDFs)

**Testing**: Vitest (unit tests for `lib/` and `hooks/`), Playwright (E2E + 375px mobile snapshot per Quality Gate 5)

**Target Platform**: Vercel (SSR/edge web), responsive from 375px viewport; mobile driver app is React Native (Expo) in a separate repo (out of scope for this plan)

**Project Type**: Web application (Next.js full-stack monorepo: App Router routes + Route Handlers for API)

**Performance Goals**: Dashboard KPIs render < 3s for fleets up to 50 trucks / 12 months history (SC-005); PDF receipt available < 10s (SC-006); offline driver data visible in panel < 30s after reconnect (SC-004, mobile-side); dashboard aggregates cached with `revalidate = 300`

**Constraints**: Integer-cent arithmetic for all money (no rounding on `saldoFinal`); 1 truck = 1 active driver enforced at DB + lib; soft-delete for freights with financial links; RLS multi-tenant isolation (zero cross-fleet access, SC-008); WCAG AA contrast; Server Components default, `"use client"` justified with a comment; lists > 50 rows paginated server-side

**Scale/Scope**: Up to 200 trucks per fleet without perceptible degradation; ~11 dashboard route segments, ~12 API resource groups, 7 prioritized user stories (P1–P7), 7 Prisma models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial evaluation (pre-Phase 0):**

- [x] Layer dependency direction respected (`types` → `lib` → `hooks` → `components` → `app`)? — Architecture enforces one-directional flow; structure below maps every directory to a layer.
- [x] New financial logic placed in `lib/finance/`? — `calcularAcerto.ts`, `calcularCusto.ts`, `calcularCaixa.ts`, `formatMoeda.ts` isolate all monetary math.
- [x] Auth checks restricted to `lib/auth/`? — `lib/auth/config.ts` centralizes Next-Auth/Supabase session; middleware delegates to it.
- [x] Monetary values stored as centavos integers? — Prisma `Int` fields (`valorBruto`, `valor`, `valorComissao`, `saldoFinal`, …); conversion to reais only in `formatMoeda.ts` at display layer.
- [x] Truck–driver 1:1 constraint enforced at DB and lib layer? — `Caminhao.motoristaId @unique` + guard in `lib/` vinculação logic.
- [x] Soft-delete guard for freights with linked financial entries? — `lib/` deletion guard inactivates instead of hard-delete when `lancamentos`/`acerto` exist (FR-020).
- [x] Client Components (`"use client"`) justified and annotated with a comment? — Default Server Components; interactive forms/charts annotated.
- [x] Row-level security (RLS) policies cover any new database tables? — RLS policies scoped by `frotaId`/owner for all 7 tables (research.md §RLS).

**Post-Phase 1 re-evaluation:** see [research.md](./research.md) and [data-model.md](./data-model.md). No new violations introduced; Complexity Tracking table remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-frete-agro-saas/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST route contracts)
│   ├── README.md
│   ├── auth.md
│   ├── caminhoes.md
│   ├── motoristas.md
│   ├── fretes.md
│   ├── lancamentos.md
│   ├── acertos.md
│   ├── caixa.md
│   └── relatorios.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
fretagro-web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx              # step 1: dados pessoais
│   │   ├── cadastro/frota/page.tsx        # step 2: dados da frota
│   │   └── recuperar-senha/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                     # sidebar + topbar + auth guard
│   │   ├── page.tsx                       # dashboard (rota raiz autenticada)
│   │   ├── frota/page.tsx
│   │   ├── fretes/page.tsx
│   │   ├── fretes/[id]/page.tsx
│   │   ├── fretes/novo/page.tsx
│   │   ├── acertos/page.tsx
│   │   ├── acertos/[motoristaId]/page.tsx
│   │   ├── caixa/page.tsx
│   │   ├── relatorios/page.tsx
│   │   └── configuracoes/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/cadastro/route.ts
│   │   ├── auth/recuperar-senha/route.ts
│   │   ├── auth/motorista/ativar/route.ts
│   │   ├── caminhoes/route.ts
│   │   ├── caminhoes/[id]/route.ts
│   │   ├── motoristas/route.ts
│   │   ├── motoristas/[id]/route.ts
│   │   ├── fretes/route.ts
│   │   ├── fretes/[id]/route.ts
│   │   ├── fretes/[id]/lancamentos/route.ts
│   │   ├── acertos/route.ts
│   │   ├── acertos/[id]/route.ts
│   │   ├── acertos/[id]/comprovante/route.ts
│   │   ├── caixa/route.ts
│   │   └── relatorios/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                                # Shadcn customizados (dark theme)
│   ├── layout/                            # Sidebar, Topbar, MobileNav
│   ├── auth/                              # LoginForm, CadastroStep1Form, CadastroStep2Form
│   ├── frota/                             # CaminhaoCard, CaminhaoModal, MotoristaModal, FrotaEmptyState
│   ├── fretes/                            # FreteCard, FreteForm, LancamentoForm, StatusBadge
│   ├── acertos/                           # AcertoCalculado, DeducaoForm, ComprovanteButton
│   ├── dashboard/                         # MetricCard, AlertaBanner, ReceitaDespesaChart, DespesasDonutChart, FretesRecentesTable
│   └── shared/                            # PeriodSelector, EmptyState, LoadingSpinner
├── lib/
│   ├── auth/config.ts
│   ├── finance/                           # calcularAcerto, calcularCusto, calcularCaixa, formatMoeda
│   ├── notifications/whatsapp.ts          # provider-agnostic driver invite sender (FR-006)
│   ├── pdf/gerarComprovante.ts
│   ├── excel/gerarRelatorio.ts
│   └── utils/                             # masks, validators
├── hooks/                                 # useFrota, useFretes, useAcertos, useDashboard
├── types/                                 # frota, frete, acerto, caixa, auth
├── prisma/schema.prisma
├── public/
├── .env.example
└── design-system.md
```

**Structure Decision**: Single Next.js full-stack web application (`fretagro-web/`). The App Router provides both the rendered routes (`app/(auth)`, `app/(dashboard)`) and the REST API surface (`app/api/*` Route Handlers), so a separate backend is unnecessary. The constitution's mandated layer flow (`types` → `lib` → `hooks` → `components` → `app`) maps directly onto the top-level directories. The React Native (Expo) driver app lives in a separate repository and consumes the same `app/api/*` contracts; it is out of scope for this plan but its API needs are captured in the contracts.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
