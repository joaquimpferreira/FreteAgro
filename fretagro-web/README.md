# FreteAgro Web — Plataforma SaaS para Gestão de Frota Agrícola

> Painel web para gestão operacional e financeira de frotas de transporte agrícola.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Database | Supabase PostgreSQL via Prisma ORM |
| Auth | Next-Auth v5 (Auth.js) bridged to Supabase Auth |
| Styling | Tailwind CSS + Shadcn/UI (dark theme) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Reports | jsPDF + xlsx (SheetJS) |
| Testing | Vitest (unit) + Playwright (E2E + 375px mobile) |
| Deploy | Vercel |

## Prerequisites

- Node.js 20 LTS
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (PostgreSQL + Auth + Storage)

## Setup

```bash
# 1. Clone and install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local and fill in all values (see comments in the file)

# 3. Generate Prisma client + run migrations
pnpm prisma generate
pnpm prisma migrate dev

# 4. Apply Row-Level Security policies (required for multi-tenant isolation)
pnpm prisma db execute --file prisma/rls-policies.sql

# 5. Start the development server
pnpm dev   # http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. All required variables are documented with placeholders in `.env.example`.

| Variable | Scope | Description |
|----------|-------|-------------|
| `DATABASE_URL` | server | Supabase Postgres via PgBouncer (port 6543) |
| `DIRECT_URL` | server | Direct Postgres connection for `prisma migrate` |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Service role key — never expose to the client |
| `NEXTAUTH_SECRET` | server | JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | server | Canonical app URL (e.g. `http://localhost:3000`) |
| `WHATSAPP_API_URL` | server | WhatsApp provider endpoint (see `lib/notifications/whatsapp.ts`) |
| `WHATSAPP_API_TOKEN` | server | WhatsApp provider auth token |

> **Security**: `SUPABASE_SERVICE_ROLE_KEY` and `NEXTAUTH_SECRET` are server-only. Never use them in Client Components or expose them to the browser.

## Quality Gates

All gates must pass before merging to `main`:

```bash
pnpm tsc --noEmit   # Gate 1: zero TypeScript errors (strict mode)
pnpm lint           # Gate 2: no ESLint errors
pnpm test           # Gate 3: Vitest unit tests (lib/finance, lib/utils)
pnpm test:e2e       # Gate 5: Playwright E2E incl. 375px mobile snapshot
```

## Project Structure

```
fretagro-web/
├── app/                   # Next.js App Router pages and API routes
│   ├── (auth)/            # Public auth pages (login, cadastro, recuperar-senha)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # REST API route handlers
├── components/            # React components (UI primitives, feature modules)
├── hooks/                 # React hooks (data fetching, state)
├── lib/                   # Business logic and utilities
│   ├── api/               # API helpers (errors, pagination, tenant guard, validate)
│   ├── auth/              # Next-Auth config, Zod schemas
│   ├── caixa/             # Cash flow logic
│   ├── db/                # Prisma singleton + Supabase clients
│   ├── finance/           # Financial calculations (centavos, acerto formula)
│   ├── fleet/             # Fleet/truck/driver business rules
│   ├── fretes/            # Freight schemas and logic
│   ├── notifications/     # WhatsApp notification module
│   ├── pdf/               # PDF receipt generation
│   ├── storage/           # Supabase Storage helpers
│   └── utils/             # Shared utilities (masks, validators, chartColors)
├── prisma/
│   ├── schema.prisma      # Database schema (7 models)
│   ├── migrations/        # Prisma migration history
│   └── rls-policies.sql   # Supabase Row-Level Security policies
├── types/                 # Shared TypeScript types and domain enums
└── e2e/                   # Playwright E2E tests
```

## Architecture Principles

1. **Layer discipline** — `types/` → `lib/` → `hooks/` → `components/` → `app/` (one-directional)
2. **Server Components default** — `"use client"` requires a justification comment
3. **Design tokens** — No hardcoded hex outside `tailwind.config.ts`, `design-system/tokens.ts`, and `lib/utils/chartColors.ts`
4. **Integer centavos** — All monetary values stored as `Int` (centavos); conversion to reais only in `lib/finance/formatMoeda.ts`
5. **1 truck = 1 active driver** — Enforced at DB (`Caminhao.motoristaId @unique`) and lib layer
6. **Multi-tenant isolation** — Supabase RLS policies + `lib/api/tenant.ts` guard; all resources scoped by `frotaId`
7. **Server-side pagination** — Lists > 50 rows use `parsePagination` / `buildPaginatedResponse` from `lib/api/pagination.ts` (cap: 50)

## Design System

See [`../design-system/DESIGN_SYSTEM.md`](../design-system/DESIGN_SYSTEM.md) for the full design system reference (color tokens, typography, spacing, components, dark theme).

Token files:
- **CSS variables**: `design-system/tokens.css`
- **TypeScript**: `design-system/tokens.ts`
- **Tailwind theme**: `fretagro-web/tailwind.config.ts`
- **Chart colors**: `fretagro-web/lib/utils/chartColors.ts` (Recharts SVG token file)

## Validation Scenarios

See [`../specs/001-frete-agro-saas/quickstart.md`](../specs/001-frete-agro-saas/quickstart.md) for end-to-end validation scenarios V1–V7 covering all user stories.
