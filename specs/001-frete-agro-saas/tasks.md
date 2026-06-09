---
description: "Task list for FreteAgro web platform implementation"
---

# Tasks: FreteAgro — Plataforma SaaS para Gestão de Frota Agrícola

**Input**: Design documents from `/specs/001-frete-agro-saas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Only the tests explicitly mandated by the project Quality Gates are included — Vitest unit tests for `lib/finance/*` and `lib/utils/*` (Gate 3) and the Playwright 375px mobile snapshot + E2E flows (Gate 5). No full TDD/contract-test suite is generated.

**Organization**: Tasks are grouped by user story (P1–P7) to enable independent implementation and testing. All paths are rooted at `fretagro-web/` (the Next.js app), except where noted.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story the task belongs to (US1–US7)
- Every task includes an exact file path

## Path Conventions

- Web app root: `fretagro-web/`
- Layer flow (constitution): `types/` → `lib/` → `hooks/` → `components/` → `app/`
- Money is always integer **centavos**; conversion to reais only in `lib/finance/formatMoeda.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [X] T001 Scaffold Next.js 14 App Router + TypeScript (strict) project at `fretagro-web/` (create `package.json`, `tsconfig.json`, `next.config.mjs`, `app/layout.tsx`, `app/globals.css`)
- [X] T002 Install core dependencies in `fretagro-web/package.json` (next, react, prisma, @prisma/client, next-auth@5, @supabase/supabase-js, @supabase/ssr, zod, react-hook-form, @hookform/resolvers, recharts, jspdf, xlsx, date-fns, tailwindcss)
- [X] T003 [P] Configure Tailwind + import design tokens into `fretagro-web/tailwind.config.ts` and `fretagro-web/app/globals.css` (extend theme from `design-system/tokens.css` / `tokens.ts`; Inter font; radii inputs/badges 8px, cards 12px, modals 16px)
- [X] T004 [P] Configure ESLint + Prettier in `fretagro-web/.eslintrc.json` and `fretagro-web/.prettierrc` (no hardcoded hex rule, layer-import discipline)
- [X] T005 [P] Configure Vitest in `fretagro-web/vitest.config.ts` with test setup for `lib/` and `hooks/`
- [X] T006 [P] Configure Playwright in `fretagro-web/playwright.config.ts` including a 375px mobile viewport project (Gate 5)
- [X] T007 [P] Create `fretagro-web/.env.example` with all variables from quickstart.md (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, WHATSAPP_API_URL, WHATSAPP_API_TOKEN)
- [X] T008 [P] Create layered directory skeleton with placeholder `index` barrels: `fretagro-web/types/`, `fretagro-web/lib/`, `fretagro-web/hooks/`, `fretagro-web/components/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define Prisma schema with all 7 models in `fretagro-web/prisma/schema.prisma` (User, Frota, Caminhao, Motorista, Frete, Lancamento, Acerto) per data-model.md — integer-cent money fields, `Caminhao.motoristaId @unique`, `Acerto.freteId @unique`, `User.email @unique`, `Caminhao.placa @unique`
- [X] T010 Generate Prisma client and create the initial migration: run `prisma generate` + `prisma migrate dev` (outputs `fretagro-web/prisma/migrations/`)
- [X] T011 Author RLS policies SQL in `fretagro-web/prisma/rls-policies.sql` scoping all 7 tables by `frotaId` / owner (research.md §2; SC-008) and document apply step
- [X] T012 [P] Create Prisma singleton client in `fretagro-web/lib/db/prisma.ts`
- [X] T013 [P] Create Supabase server/browser clients (`@supabase/ssr`) in `fretagro-web/lib/db/supabase.ts` (service-role isolated to server-only path)
- [X] T014 [P] Define shared domain types in `fretagro-web/types/` (`frota.ts`, `frete.ts`, `acerto.ts`, `caixa.ts`, `auth.ts`) aligned with data-model.md enums and status unions
- [X] T015 [P] Implement `fretagro-web/lib/finance/formatMoeda.ts` (centavos → BRL string, display layer only)
- [X] T016 [P] [Test] Vitest unit tests for `formatMoeda` in `fretagro-web/lib/finance/formatMoeda.test.ts`
- [X] T017 [P] Implement input masks + validators in `fretagro-web/lib/utils/masks.ts` and `fretagro-web/lib/utils/validators.ts` (placa Mercosul/legacy, whatsapp, estado/UF)
- [X] T018 [P] [Test] Vitest unit tests for masks/validators in `fretagro-web/lib/utils/validators.test.ts`
- [X] T019 Implement Next-Auth v5 config bridged to Supabase Auth in `fretagro-web/lib/auth/config.ts` (Credentials provider, session carries `frotaId` + `role`)
- [X] T020 Implement route-protection middleware delegating to `lib/auth/config.ts` in `fretagro-web/middleware.ts` (redirect unauth web routes to `/login`, return 401 for API)
- [X] T021 [P] Create shared API helpers in `fretagro-web/lib/api/` (`errors.ts` standard error shape + status codes, `pagination.ts` page/pageSize≤50 parsing, `tenant.ts` frotaId-scoping guard) per contracts/README.md
- [X] T022 [P] Create reusable Zod schema validation wrapper for Route Handlers in `fretagro-web/lib/api/validate.ts` (returns 422 with field errors)
- [X] T023 [P] Add Shadcn/UI base primitives re-skinned to dark theme in `fretagro-web/components/ui/` (button, input, dialog/modal, badge, card, table, select)
- [X] T024 [P] Create shared layout components in `fretagro-web/components/layout/` (`Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`) and shared widgets in `fretagro-web/components/shared/` (`EmptyState.tsx`, `LoadingSpinner.tsx`, `PeriodSelector.tsx`)
- [X] T025 Create root authenticated layout with auth guard in `fretagro-web/app/(dashboard)/layout.tsx` (sidebar + topbar)
- [X] T101 [P] Implement WhatsApp notification module in `fretagro-web/lib/notifications/whatsapp.ts` (provider-agnostic wrapper for driver activation invite; document provider choice, e.g. Twilio WhatsApp or Zapi; add `WHATSAPP_API_URL` and `WHATSAPP_API_TOKEN` to `.env.example`) (FR-006)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Autenticação e Onboarding (Priority: P1) 🎯 MVP

**Goal**: Owner can register a fleet, log in, recover password; drivers activate via WhatsApp invite; protected routes redirect to login; first access shows guided welcome.

**Independent Test**: Create an owner account, log in to the empty dashboard with the guided welcome, confirm unauthenticated access redirects to `/login`, and activate a driver via invite link.

### Implementation for User Story 1

- [ ] T026 [P] [US1] Zod schemas for auth in `fretagro-web/lib/auth/schemas.ts` (cadastro, login, recuperar-senha, motorista ativar) per contracts/auth.md
- [ ] T027 [US1] Owner registration handler `POST /api/auth/cadastro` in `fretagro-web/app/api/auth/cadastro/route.ts` (creates User + Frota, 409 EMAIL_TAKEN, 422 validation) (FR-001, FR-002)
- [ ] T028 [US1] Next-Auth catch-all route `fretagro-web/app/api/auth/[...nextauth]/route.ts` (login via Credentials, role-based routing) (FR-003)
- [ ] T029 [P] [US1] Password recovery handler `POST /api/auth/recuperar-senha` in `fretagro-web/app/api/auth/recuperar-senha/route.ts` (200 always, no enumeration) (FR-005)
- [ ] T030 [P] [US1] Driver activation handler `POST /api/auth/motorista/ativar` in `fretagro-web/app/api/auth/motorista/ativar/route.ts` (token + senha, sets `appAtivado`) (FR-006, FR-007)
- [ ] T031 [P] [US1] LoginForm in `fretagro-web/components/auth/LoginForm.tsx` (`"use client"`, RHF + Zod)
- [ ] T032 [P] [US1] CadastroStep1Form + CadastroStep2Form in `fretagro-web/components/auth/CadastroStep1Form.tsx` and `CadastroStep2Form.tsx` (`"use client"`)
- [ ] T033 [US1] Login page `fretagro-web/app/(auth)/login/page.tsx`
- [ ] T034 [US1] Registration pages `fretagro-web/app/(auth)/cadastro/page.tsx` (dados pessoais) and `fretagro-web/app/(auth)/cadastro/frota/page.tsx` (dados da frota)
- [ ] T035 [P] [US1] Password recovery page `fretagro-web/app/(auth)/recuperar-senha/page.tsx`
- [ ] T036 [US1] Guided welcome / first-access empty-state on the dashboard root `fretagro-web/app/(dashboard)/page.tsx` directing first truck + driver registration (FR-014)
- [ ] T037 [P] [US1] [Test] Playwright E2E for register → login → guided welcome → unauth redirect in `fretagro-web/e2e/auth.spec.ts` (incl. 375px snapshot)

**Checkpoint**: User Story 1 fully functional and independently testable — MVP candidate

---

## Phase 4: User Story 2 — Gestão da Frota (caminhões e motoristas) (Priority: P2)

**Goal**: Owner manages trucks and drivers, binds exactly one active driver per truck, edits/inactivates preserving history, and sees the "sem motorista" alert.

**Independent Test**: Create a truck and a driver, bind them (alert clears), attempt to bind the same driver to a second truck (rejected with 409 DRIVER_ALREADY_BOUND).

### Implementation for User Story 2

- [ ] T038 [P] [US2] Zod schemas for caminhão/motorista in `fretagro-web/lib/fleet/schemas.ts` (placa, carroceria enum, percentualComissao 0–100) per contracts
- [ ] T039 [US2] 1-truck-1-driver binding guard in `fretagro-web/lib/fleet/vincularMotorista.ts` (defense-in-depth over DB `@unique`, explanatory 409) (FR-011)
- [ ] T040 [US2] Caminhões collection handlers `GET`/`POST /api/caminhoes` in `fretagro-web/app/api/caminhoes/route.ts` (paginated, `?status`, `?semMotorista`, 409 PLACA_TAKEN) (FR-009, FR-015)
- [ ] T041 [US2] Caminhão item handlers `GET`/`PATCH`/`DELETE /api/caminhoes/[id]` in `fretagro-web/app/api/caminhoes/[id]/route.ts` (bind/unbind driver via PATCH, soft-inactivate on DELETE) (FR-012, FR-013)
- [ ] T042 [US2] Motoristas collection handlers `GET`/`POST /api/motoristas` in `fretagro-web/app/api/motoristas/route.ts` (create dispatches WhatsApp invite via `lib/notifications/whatsapp.ts`; depends on T101) (FR-010, FR-006)
- [ ] T043 [US2] Motorista item handlers `GET`/`PATCH`/`DELETE /api/motoristas/[id]` in `fretagro-web/app/api/motoristas/[id]/route.ts` (edit, soft-inactivate preserving history) (FR-012, FR-013)
- [ ] T044 [P] [US2] `useFrota` data hook in `fretagro-web/hooks/useFrota.ts`
- [ ] T045 [P] [US2] Fleet components in `fretagro-web/components/frota/` (`CaminhaoCard.tsx`, `CaminhaoModal.tsx`, `MotoristaModal.tsx`, `FrotaEmptyState.tsx`) (`"use client"` for modals)
- [ ] T046 [US2] Frota page `fretagro-web/app/(dashboard)/frota/page.tsx` (truck/driver lists, sem-motorista alert, modals)
- [ ] T047 [P] [US2] [Test] Playwright E2E for create+bind+double-bind-rejection in `fretagro-web/e2e/frota.spec.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 — Registro de Fretes (Priority: P3)

**Goal**: Owner registers freights with operational data, attaches expenses with nota fiscal photos, advances the status lifecycle, filters freights, and soft-deletes freights with financial links.

**Independent Test**: Create a freight (`em_andamento`), add an expense (one with `deducaoAcerto: true`), conclude with `kmFinal ≥ kmInicial`, and confirm delete soft-deletes.

### Implementation for User Story 3

- [ ] T048 [P] [US3] Zod schemas for frete + lançamento in `fretagro-web/lib/fretes/schemas.ts` (tipoCarga enum, `valorBruto ≥ 0`, `kmFinal ≥ kmInicial`, lançamento tipo enum) per contracts
- [ ] T049 [P] [US3] Status-transition guard in `fretagro-web/lib/fretes/statusMachine.ts` (em_andamento → concluido → acerto_pendente → acerto_realizado; 409 on invalid) (FR-018)
- [ ] T050 [P] [US3] Soft-delete guard in `fretagro-web/lib/fretes/deleteGuard.ts` (inactivate when lançamentos/acerto exist, else hard-delete) (FR-020)
- [ ] T051 [US3] Nota fiscal photo upload to Supabase Storage with MIME validation in `fretagro-web/lib/storage/uploadNotaFiscal.ts` (rejects corrupted/unsupported) (FR-017, Edge Case)
- [ ] T052 [US3] Fretes collection handlers `GET`/`POST /api/fretes` in `fretagro-web/app/api/fretes/route.ts` (paginated + filters status/motoristaId/caminhaoId/from/to/rota) (FR-016, FR-019)
- [ ] T053 [US3] Frete item handlers `GET`/`PATCH`/`DELETE /api/fretes/[id]` in `fretagro-web/app/api/fretes/[id]/route.ts` (status advance with kmFinal validation, soft-delete) (FR-018, FR-020)
- [ ] T054 [US3] Lançamentos handlers `GET`/`POST /api/fretes/[id]/lancamentos` in `fretagro-web/app/api/fretes/[id]/lancamentos/route.ts` (expense create updates totalDespesas, multipart photo) (FR-017)
- [ ] T055 [P] [US3] `useFretes` data hook in `fretagro-web/hooks/useFretes.ts`
- [ ] T056 [P] [US3] Fretes components in `fretagro-web/components/fretes/` (`FreteCard.tsx`, `FreteForm.tsx`, `LancamentoForm.tsx`, `StatusBadge.tsx`) (`"use client"` for forms)
- [ ] T057 [US3] Fretes list + filters page `fretagro-web/app/(dashboard)/fretes/page.tsx`
- [ ] T058 [P] [US3] New freight page `fretagro-web/app/(dashboard)/fretes/novo/page.tsx`
- [ ] T059 [US3] Freight detail page `fretagro-web/app/(dashboard)/fretes/[id]/page.tsx` (status, totalDespesas, expense list with photos)
- [ ] T060 [P] [US3] [Test] Playwright E2E for freight create → expense → conclude → soft-delete in `fretagro-web/e2e/fretes.spec.ts`

**Checkpoint**: User Stories 1–3 independently functional

---

## Phase 6: User Story 4 — Acerto Financeiro com Motorista (Priority: P4)

**Goal**: Owner opens a settlement for a concluded freight with auto-computed commission and deductions, confirms payment (concurrency-guarded), and generates a PDF receipt for WhatsApp. Driver views own balance/history.

**Independent Test**: Open a settlement, verify `valorComissao`/`totalDeducoes`/`saldoFinal` exactly, confirm payment (freight → `acerto_realizado`), generate PDF, and confirm a second-device confirm is rejected with 409.

### Implementation for User Story 4

- [ ] T061 [US4] Settlement calculation engine in `fretagro-web/lib/finance/calcularAcerto.ts` (`valorComissao = round(valorFrete×%/100)`, `totalDeducoes` = Σ deduction lançamentos, `saldoFinal = valorComissao − totalDeducoes` never rounded) (FR-021, SC-002)
- [ ] T062 [P] [US4] [Test] Vitest unit tests for `calcularAcerto` with quickstart V4 example values + edge cents in `fretagro-web/lib/finance/calcularAcerto.test.ts` (Gate 3)
- [ ] T063 [P] [US4] Cost/profit helper `fretagro-web/lib/finance/calcularCusto.ts` (used by caixa later; commission feed) 
- [ ] T064 [US4] PDF receipt generator in `fretagro-web/lib/pdf/gerarComprovante.ts` (driver data, freight data, itemized commission + deductions, saldoFinal) (FR-025)
- [ ] T065 [US4] Acertos collection handlers `GET`/`POST /api/acertos` in `fretagro-web/app/api/acertos/route.ts` (open settlement 409 if not concluido / already exists; list with `?motoristaId`/`?status`; `motoristaId=me` driver view) (FR-021, FR-026, FR-027, FR-028)
- [ ] T066 [US4] Acerto item handler `GET`/`PATCH /api/acertos/[id]` in `fretagro-web/app/api/acertos/[id]/route.ts` (confirm → realizado + freight acerto_realizado, 409 concurrency guard) (FR-024)
- [ ] T067 [US4] Receipt handler `POST /api/acertos/[id]/comprovante` in `fretagro-web/app/api/acertos/[id]/comprovante/route.ts` (generate, store in Supabase Storage, return URL) (FR-025, SC-006)
- [ ] T068 [P] [US4] `useAcertos` data hook in `fretagro-web/hooks/useAcertos.ts`
- [ ] T069 [P] [US4] Acertos components in `fretagro-web/components/acertos/` (`AcertoCalculado.tsx`, `DeducaoForm.tsx`, `ComprovanteButton.tsx`) (`"use client"`)
- [ ] T070 [US4] Acertos list page `fretagro-web/app/(dashboard)/acertos/page.tsx` (pending alerts)
- [ ] T071 [US4] Per-driver settlement detail/history page `fretagro-web/app/(dashboard)/acertos/[motoristaId]/page.tsx` (FR-026)
- [ ] T072 [P] [US4] [Test] Playwright E2E for open → confirm → PDF → second-confirm-409 in `fretagro-web/e2e/acertos.spec.ts`

**Checkpoint**: User Stories 1–4 independently functional

---

## Phase 7: User Story 5 — Caixa da Frota (Priority: P5)

**Goal**: Owner views the full cash-flow statement (freight receipts + categorized outflows), records manual outflows, and sees real net profit and expense composition by category.

**Independent Test**: Add a manual outflow, request the period statement, and verify `lucroLiquido = receitas − todas despesas` with per-category totals + percentuals.

### Implementation for User Story 5

- [ ] T073 [US5] Net-profit + expense-composition aggregation in `fretagro-web/lib/finance/calcularCaixa.ts` (`lucroLiquido = Σ receitas − Σ todas despesas`, category totals + %) (FR-031, FR-032)
- [ ] T074 [P] [US5] [Test] Vitest unit tests for caixa aggregation in `fretagro-web/lib/finance/calcularCaixa.test.ts` (Gate 3)
- [ ] T075 [P] [US5] Zod schema for manual caixa entry in `fretagro-web/lib/caixa/schemas.ts` (valor, data, categoria enum)
- [ ] T076 [US5] Caixa handlers `GET`/`POST /api/caixa` in `fretagro-web/app/api/caixa/route.ts` (period statement with entradas/saídas; manual avulso outflow as freteless Lancamento) (FR-029, FR-030)
- [ ] T077 [P] [US5] `useCaixa` data hook in `fretagro-web/hooks/useCaixa.ts`
- [ ] T078 [P] [US5] Caixa components in `fretagro-web/components/dashboard/` (`ExtratoTable.tsx`, `LancamentoAvulsoForm.tsx`, `ComposicaoDespesas.tsx`) (`"use client"` for form)
- [ ] T079 [US5] Caixa page `fretagro-web/app/(dashboard)/caixa/page.tsx` (period selector, statement, net profit, composition)
- [ ] T080 [P] [US5] [Test] Playwright E2E for manual outflow + statement totals in `fretagro-web/e2e/caixa.spec.ts`

**Checkpoint**: User Stories 1–5 independently functional

---

## Phase 8: User Story 6 — Dashboard e Relatórios (Priority: P6)

**Goal**: Owner sees consolidated KPIs and trend charts on the dashboard with period filters and attention alerts, and exports financial reports as PDF/Excel.

**Independent Test**: Load the dashboard for a period (KPIs + alerts + charts render), then export both a PDF and an Excel report containing all accounting data.

### Implementation for User Story 6

- [ ] T081 [US6] Dashboard KPI/aggregation queries in `fretagro-web/lib/dashboard/aggregates.ts` (receita bruta, total fretes, despesas, lucro líquido; alerts: acertos pendentes + caminhões sem motorista) (FR-033, FR-028, FR-015)
- [ ] T082 [P] [US6] Excel report generator in `fretagro-web/lib/excel/gerarRelatorio.ts` (receitas, despesas categorizadas, lucro líquido) (FR-036, SC-009)
- [ ] T083 [P] [US6] PDF report generator in `fretagro-web/lib/pdf/gerarRelatorio.ts` (reuses jsPDF) (FR-036)
- [ ] T084 [US6] Relatórios export handler `GET /api/relatorios` in `fretagro-web/app/api/relatorios/route.ts` (`?formato=pdf|excel`, `?from`/`?to`) (FR-036)
- [ ] T085 [P] [US6] `useDashboard` data hook in `fretagro-web/hooks/useDashboard.ts`
- [ ] T086 [P] [US6] Dashboard chart/metric components in `fretagro-web/components/dashboard/` (`MetricCard.tsx`, `AlertaBanner.tsx`, `ReceitaDespesaChart.tsx`, `DespesasDonutChart.tsx`, `FretesRecentesTable.tsx`) (`"use client"` for Recharts)
- [ ] T087 [US6] Wire dashboard root `fretagro-web/app/(dashboard)/page.tsx` with KPIs, alerts, charts, period filter and `export const revalidate = 300` (FR-033, FR-034, FR-035, SC-005)
- [ ] T088 [US6] Relatórios page `fretagro-web/app/(dashboard)/relatorios/page.tsx` (period selector + PDF/Excel export buttons)
- [ ] T089 [P] [US6] [Test] Playwright E2E for dashboard render + PDF/Excel export in `fretagro-web/e2e/dashboard.spec.ts`

**Checkpoint**: User Stories 1–6 independently functional — full owner web panel complete

---

## Phase 9: User Story 7 — Suporte de API ao App Mobile do Motorista (Priority: P7)

**Goal**: The web API accepts driver trip start/end and expense writes (synced from the offline mobile app) idempotently and exposes the driver "Meus ganhos" view. The React Native (Expo) app itself lives in a **separate repository** and is out of scope here.

**Independent Test**: As an authenticated driver session, start a trip (`POST /api/fretes`), add an expense with photo (`POST /api/fretes/[id]/lancamentos`), end the trip (`PATCH /api/fretes/[id]` with kmFinal), replay a duplicate synced write, and read `GET /api/acertos?motoristaId=me`.

### Implementation for User Story 7

- [ ] T090 [US7] Extend `lib/auth/config.ts` authorization so `motorista` sessions may start/end/expense only their own bound-truck freights (403 otherwise) in `fretagro-web/lib/auth/config.ts`
- [ ] T091 [US7] Add idempotent-write support (client-supplied dedupe key) for synced trip/expense writes in `fretagro-web/lib/api/idempotency.ts` and apply in fretes + lançamentos handlers (FR-041 server side, SC-004)
- [ ] T092 [US7] Confirm driver "Meus ganhos" path `GET /api/acertos?motoristaId=me` returns balance + confirmed history for the authenticated driver in `fretagro-web/app/api/acertos/route.ts` (FR-027)
- [ ] T093 [P] [US7] [Test] Playwright/Vitest API test for driver trip start→expense→end + duplicate-sync idempotency in `fretagro-web/e2e/mobile-sync.spec.ts`

**Checkpoint**: Web API fully supports the separate mobile driver app

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Hardening and validation across all stories

- [ ] T094 [P] Multi-tenant isolation E2E (cross-fleet 404, RLS at DB level) in `fretagro-web/e2e/tenant-isolation.spec.ts` (SC-008, quickstart V7)
- [ ] T095 [P] Verify 375px mobile snapshot coverage across all dashboard routes in Playwright (Gate 5)
- [ ] T096 [P] Add server-side pagination assertions for all list endpoints (≤50) and audit for unbounded fetches (Principle V)
- [ ] T097 [P] Audit all `"use client"` files for the mandatory justification comment and confirm no hardcoded hex outside token files (Principle II, III)
- [ ] T098 Run quality gates: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` and fix failures (quickstart Build/Quality Gates)
- [ ] T099 [P] Finalize `fretagro-web/.env.example` and write `fretagro-web/design-system.md` reference + README setup steps (quickstart parity)
- [ ] T100 Execute quickstart.md validation scenarios V1–V7 end-to-end and record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–9)**: All depend on Foundational completion
  - US1 → US2 → US3 → US4 → US5 → US6 in priority order
  - US7 depends on US3 (fretes/lançamentos handlers) and US4 (acertos driver view)
- **Polish (Phase 10)**: Depends on all targeted user stories being complete

### User Story Dependencies

- **US1 (P1)**: Only Foundational — no story deps (MVP)
- **US2 (P2)**: Foundational; independently testable (trucks/drivers)
- **US3 (P3)**: Foundational; uses US2 trucks/drivers as references but is independently testable
- **US4 (P4)**: Depends on US3 (needs concluded freights + deduction lançamentos)
- **US5 (P5)**: Depends on US3/US4 data (receipts + commissions) but independently testable with manual entries
- **US6 (P6)**: Aggregates across US3–US5; independently testable with seeded data
- **US7 (P7)**: Depends on US3 + US4 handlers

### Within Each User Story

- Schemas/lib guards → hooks → components → pages/handlers
- `lib/finance` math before any handler consuming it
- Mandated unit/E2E tests alongside their feature (not full TDD)

### Parallel Opportunities

- All Phase 1 `[P]` setup tasks run in parallel
- In Phase 2, `[P]` tasks (types, formatMoeda, masks, API helpers, UI primitives) run in parallel after Prisma schema/migration (T009–T011)
- Within each story, `[P]` schema/hook/component/test tasks run in parallel; route handlers sharing a file run sequentially
- Once Foundational is done, separate developers can take US1, US2, US3 in parallel (US4+ wait on US3 data)

---

## Parallel Example: User Story 4

```bash
# After T061 (calcularAcerto) lands, run in parallel:
Task: "[Test] Vitest unit tests for calcularAcerto in fretagro-web/lib/finance/calcularAcerto.test.ts"
Task: "calcularCusto helper in fretagro-web/lib/finance/calcularCusto.ts"
Task: "useAcertos hook in fretagro-web/hooks/useAcertos.ts"
Task: "Acertos components in fretagro-web/components/acertos/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (auth + onboarding)
4. **STOP and VALIDATE**: run quickstart V1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate (V1) → deploy (MVP: login + onboarding)
3. US2 → validate (V2) → deploy (fleet management)
4. US3 → validate (V3) → deploy (freights + expenses)
5. US4 → validate (V4) → deploy (settlements — core differentiator)
6. US5 → validate (V5) → deploy (cash flow)
7. US6 → validate (V6) → deploy (dashboard + reports)
8. US7 → validate (mobile sync) → enables the separate driver app

### Parallel Team Strategy

After Foundational completes: Dev A → US1, Dev B → US2, Dev C → US3; US4–US7 follow as their data dependencies land.

---

## Notes

- `[P]` = different files, no dependencies
- `[Story]` label maps each task to its user story for traceability
- All money is integer centavos; reais only in `formatMoeda.ts`
- Every `"use client"` file must carry a one-line justification comment (Principle II)
- The React Native (Expo) driver app is a separate repository — Phase 9 covers only the web API support it consumes
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
