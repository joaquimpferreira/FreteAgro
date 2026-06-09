# Quickstart & Validation Guide: FreteAgro Web Platform

**Feature**: 001-frete-agro-saas | **Date**: 2026-06-08

This guide explains how to bootstrap the web project and validate that the feature works end-to-end. It references [data-model.md](./data-model.md) and [contracts/](./contracts/) instead of duplicating their content. Implementation details belong in `tasks.md`.

## Prerequisites

- Node.js 20 LTS, pnpm (or npm)
- A Supabase project (PostgreSQL + Auth + Storage)
- Vercel account (for deploy)

## Environment variables (`.env.example`)

Per Principle VII, every required variable is documented with placeholders:

```bash
# Database (Supabase Postgres, used by Prisma)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"   # browser-exposed (intentional)
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"               # browser-exposed (intentional)
SUPABASE_SERVICE_ROLE_KEY="service-role-key"                  # server-only, never bundled

# Next-Auth v5
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Only `NEXT_PUBLIC_*` values reach the browser (Principle VI). `SUPABASE_SERVICE_ROLE_KEY` and `NEXTAUTH_SECRET` are server-only.

## Setup commands

```bash
# 1. Install
pnpm install

# 2. Generate Prisma client + run migrations
pnpm prisma generate
pnpm prisma migrate dev

# 3. Apply RLS policies (raw SQL migration, after Prisma migrate — see research.md §2 & §10)
pnpm prisma db execute --file prisma/rls-policies.sql

# 4. Run dev server
pnpm dev   # http://localhost:3000
```

## Build / quality gates (must pass before merge)

```bash
pnpm tsc --noEmit     # Gate 1: zero TS errors (Principle I, VII)
pnpm lint             # Gate 2: no ESLint errors
pnpm test             # Gate 3: Vitest unit tests (lib/finance, lib/utils)
pnpm test:e2e         # Gate 5: Playwright incl. 375px mobile snapshot
```

## Validation scenarios

Each scenario maps to a user story and its acceptance criteria in [spec.md](./spec.md). Run them against a fresh fleet.

### V1 — Auth & onboarding (US1 / FR-001..FR-008)

1. Register an owner via `POST /api/auth/cadastro` ([auth.md](./contracts/auth.md)).
2. Log in; confirm redirect to the empty dashboard with the guided welcome (FR-014).
3. Confirm an unauthenticated request to any `(dashboard)` route redirects to `/login` (FR-004).
- **Expected**: owner + fleet created; second registration with same email → `409`.

### V2 — Fleet management (US2 / FR-009..FR-013, FR-015)

1. Create a truck and a driver ([caminhoes.md](./contracts/caminhoes.md), [motoristas.md](./contracts/motoristas.md)).
2. Bind the driver to the truck; confirm the "sem motorista" alert clears (FR-015).
3. Attempt to bind the same driver to a second truck.
- **Expected**: second binding rejected with `409 DRIVER_ALREADY_BOUND` (1 truck = 1 driver, Principle IV).

### V3 — Freight + expenses (US3 / FR-016..FR-020)

1. Create a freight (`status: em_andamento`) and add expenses, one with `deducaoAcerto: true` ([fretes.md](./contracts/fretes.md), [lancamentos.md](./contracts/lancamentos.md)).
2. Conclude the freight with `kmFinal ≥ kmInicial`.
3. Try to delete the freight.
- **Expected**: `totalDespesas` updates; deletion soft-deletes (history preserved, FR-020); `kmFinal < kmInicial` → `422`.

### V4 — Settlement (US4 / FR-021..FR-028) — highest-risk

1. Open a settlement for the concluded freight ([acertos.md](./contracts/acertos.md)).
2. Verify `valorComissao = round(valorFrete × percentual / 100)`, `totalDeducoes` = sum of deduction expenses, `saldoFinal = valorComissao − totalDeducoes` (no rounding).
3. Confirm payment → freight becomes `acerto_realizado`; generate the PDF receipt.
4. Re-confirm from a second session.
- **Expected**: `saldoFinal` is exact to the centavo (SC-002); PDF available < 10s (SC-006); second confirm → `409` (concurrency guard).
- **Unit test (Gate 3)**: `lib/finance/calcularAcerto.ts` covered by Vitest with the example values above.

### V5 — Cash flow (US5 / FR-029..FR-032)

1. Add a manual outflow and request the period statement ([caixa.md](./contracts/caixa.md)).
- **Expected**: `lucroLiquido = receitas − todas despesas`; each category shows total + percentual.

### V6 — Dashboard & reports (US6 / FR-033..FR-036)

1. Load the dashboard for a period; export a PDF and an Excel report ([relatorios.md](./contracts/relatorios.md)).
- **Expected**: KPIs render < 3s for ≤ 50 trucks / 12 months (SC-005); alerts show acertos pendentes + caminhões sem motorista; report contains all accounting data (SC-009).

### V7 — Multi-tenant isolation (SC-008 / Principle VI)

1. Create a second fleet/owner. As owner B, request owner A's truck/freight/acerto by id.
- **Expected**: `404` for every cross-fleet resource; RLS blocks at the DB level even if a query omits the `frotaId` filter (research.md §2).

## Notes on the mobile app

The React Native (Expo) driver app is a **separate repository** and is out of scope for this plan. It consumes the same `app/api/*` contracts (notably [fretes.md](./contracts/fretes.md), [lancamentos.md](./contracts/lancamentos.md), [acertos.md](./contracts/acertos.md)). Offline capture/sync (FR-040, FR-041, SC-004) is implemented on the mobile side; the web API only needs to accept the synced writes idempotently.
