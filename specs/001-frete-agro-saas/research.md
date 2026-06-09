# Phase 0 Research: FreteAgro Web Platform

**Feature**: 001-frete-agro-saas | **Date**: 2026-06-08

This document resolves the technical unknowns for the web platform and records the rationale behind each decision. The user provided an explicit stack, so most "NEEDS CLARIFICATION" items are pre-resolved; the entries below capture *how* each choice satisfies the constitution and spec.

---

## 1. Auth: Next-Auth v5 bridged to Supabase Auth

- **Decision**: Use Next-Auth v5 (Auth.js) with a Credentials provider that authenticates against Supabase Auth, plus a custom adapter so the session carries `frotaId` and `role` (`dono` | `motorista`). Route protection is implemented in Next.js middleware that delegates session validation to `lib/auth/config.ts`.
- **Rationale**: The constitution (Principle VI) requires every authenticated route to be guarded by middleware and forbids session checks outside `lib/auth/`. Next-Auth v5 supports the App Router and middleware natively. Bridging to Supabase Auth lets the mobile app and web share one identity source.
- **Alternatives considered**:
  - *Supabase Auth alone (no Next-Auth)*: simpler, but middleware session ergonomics and typed session callbacks are weaker in the App Router; rejected for DX and role/tenant claims.
  - *Clerk/Auth0*: third-party hosted; adds cost and a second identity store conflicting with Supabase RLS based on the Supabase JWT; rejected.
- **Notes**: Driver self-registration is forbidden (Principle IV). Drivers are created by the owner and activate via a WhatsApp invite link that mints a Supabase password-set token.

## 2. Multi-tenant isolation: Supabase RLS + lib guards

- **Decision**: Enable Postgres Row-Level Security on all seven tables. Policies key off the authenticated user's fleet: a `dono` may only read/write rows whose `frotaId` belongs to a fleet they own; a `motorista` may only read rows for their own driver/freight scope. The Supabase JWT (with `frota_id` claim) is the policy input. `lib/` data-access helpers additionally scope every query by `frotaId` as defense-in-depth.
- **Rationale**: SC-008 / Principle VI mandate zero cross-fleet access enforced at the database level. RLS guarantees isolation even if an application bug omits a `WHERE frotaId`. Prisma connects through Supabase; for RLS to apply, requests run with the user's JWT via the Supabase client / a per-request Postgres role.
- **Alternatives considered**:
  - *Application-layer filtering only*: violates the constitution (DB-level isolation required); rejected.
  - *Schema-per-tenant*: operationally heavy for up to 200 trucks per fleet and many fleets; rejected.
- **Implementation note**: Prisma does not set the JWT automatically. Use Supabase's connection with `request.jwt.claims` (PgBouncer + `SET LOCAL`), or perform RLS-sensitive reads through `@supabase/supabase-js` with the user session and reserve Prisma+service-role for trusted server actions that re-apply `frotaId` scoping. Documented in `quickstart.md`.

## 3. Monetary representation: integer centavos end-to-end

- **Decision**: Store every monetary value as a Postgres `Int` (centavos). Never use floats. `valorComissao = Math.round(valorFrete * percentualComissao / 100)`; `saldoFinal = valorComissao - totalDeducoes` is computed with integer subtraction and **never rounded**. Conversion to reais happens only in `lib/finance/formatMoeda.ts` for display.
- **Rationale**: Principle IV (Settlement calculation) and FR-021 require exact integer-cent arithmetic and forbid rounding `saldoFinal`. SC-002 demands 100% precision.
- **Alternatives considered**: `Decimal`/`numeric` columns — correct but heavier and invites float coercion in JS; integer cents is the simplest exact model and is the established project convention.
- **Edge note**: `Math.round` on `valorComissao` is the single intentional rounding point (commission). It is applied once and persisted as a snapshot in `Acerto.valorComissao`.

## 4. Server vs Client Components

- **Decision**: Server Components are the default for all route segments (data fetching, dashboard aggregates). `"use client"` is added only to interactive leaves: forms (React Hook Form), Recharts charts, modals, and the period selector. Each `"use client"` file carries a one-line comment justifying interactivity.
- **Rationale**: Principle II mandates Server Components by default and an annotated justification for every Client Component.
- **Alternatives considered**: Client-heavy SPA approach — rejected; loses SSR caching and conflicts with the dashboard `revalidate = 300` requirement.

## 5. Forms & validation: React Hook Form + Zod

- **Decision**: Every form that writes to the database uses React Hook Form with a Zod resolver. The same Zod schemas are reused server-side inside Route Handlers to validate the payload before any Prisma call.
- **Rationale**: Quality Gate 4 / Principle VI require Zod validation for every DB-writing form and sanitized input before queries. Sharing schemas client+server avoids drift.
- **Alternatives considered**: Yup/Formik — Zod gives first-class TypeScript inference matching the `types/` layer; chosen for type-safety.

## 6. Dashboard charts: Recharts + caching

- **Decision**: Recharts for the receita×despesa bar/line chart and the despesas-by-category donut. Aggregate queries run in Server Components/Route Handlers and are cached with `export const revalidate = 300`.
- **Rationale**: Principle V mandates 5-minute caching of dashboard aggregates and a < 3s render (SC-005). Recharts is React-native and SSR-friendly.
- **Alternatives considered**: Chart.js (imperative canvas, weaker React integration), Tremor (opinionated theme conflicts with the custom dark tokens); rejected.

## 7. PDF & Excel generation

- **Decision**: `jsPDF` for the settlement receipt (`lib/pdf/gerarComprovante.ts`) and `xlsx` (SheetJS) for financial reports (`lib/excel/gerarRelatorio.ts`). Generation runs server-side in the `relatorios`/`acertos` Route Handlers; outputs are streamed to the client and/or persisted to Supabase Storage.
- **Rationale**: FR-025/FR-036 require PDF receipts and PDF+Excel reports; SC-006 requires the PDF in < 10s. Both libraries are mature and dependency-light.
- **Alternatives considered**: Puppeteer/headless-Chrome PDF (heavy cold-start on Vercel, exceeds 10s budget), server-side `exceljs` (heavier than `xlsx`); rejected.

## 8. Storage of nota fiscal photos

- **Decision**: Supabase Storage bucket for expense photos and generated receipts. URLs (`fotoUrl`, `comprovanteUrl`) stored as strings on `Lancamento`/`Acerto`. Images displayed via `next/image`.
- **Rationale**: Principle V requires `next/image`; Supabase Storage integrates with the same project and RLS. Handles corrupted/unsupported uploads by validating MIME/type at the API boundary (Edge Case in spec).
- **Alternatives considered**: Vercel Blob (separate vendor), S3 (extra credentials); Supabase keeps one platform.

## 9. Pagination strategy

- **Decision**: All potentially unbounded lists (`fretes`, `lancamentos`, `acertos`, caixa entries) use server-side cursor/offset pagination with a default page size ≤ 50. List Route Handlers accept `page`/`pageSize`/`cursor` query params.
- **Rationale**: Principle V forbids loading unbounded result sets; lists may exceed 50 rows.
- **Alternatives considered**: Client-side pagination of a full fetch — violates the constitution; rejected.

## 10. ORM & migrations: Prisma over Supabase Postgres

- **Decision**: Prisma is the ORM and migration tool (`prisma migrate`). The schema is the one provided in the spec (7 models). RLS policies are added via SQL migrations alongside Prisma migrations (Prisma does not manage RLS).
- **Rationale**: Principle VII mandates Postgres via Supabase; Prisma gives typed access matching `types/`. RLS lives in raw SQL migration files applied after `prisma migrate`.
- **Alternatives considered**: Drizzle (lighter but less mature migration tooling at project scale), raw Supabase client only (loses typed relational queries); rejected.

## 11. Testing approach

- **Decision**: Vitest for unit tests of `lib/finance/*` (settlement math is the highest-risk logic — Quality Gate 3 requires a unit test for new `lib/`/`hooks/` code) and `lib/utils/*` (masks, validators). Playwright for E2E flows and the mandatory 375px mobile snapshot (Quality Gate 5).
- **Rationale**: Constitution Quality Gates 3 and 5. Vitest integrates cleanly with the Next.js/TS toolchain.
- **Alternatives considered**: Jest (slower TS setup), Cypress (Playwright preferred for built-in mobile viewport snapshots); rejected.

## 12. Design tokens & theming

- **Decision**: Consume `design-system/tokens.css` and `tokens.ts` as the single source of truth; Tailwind theme extends from these tokens. Shadcn/UI components are re-skinned to the dark theme. No hardcoded hex outside the token files.
- **Rationale**: Principle III forbids hardcoded colors and mandates the Rayna UI dark theme and Inter font. Border radii: inputs/badges 8px, cards 12px, modals 16px per the user's brief.
- **Note**: The user brief lists semantic colors (primary `#22C55E`, etc.); the repo's `DESIGN_SYSTEM.md` uses the Rayna scale (primary base `#16b84f`). The token files are authoritative — components reference tokens, not literals, so both stay consistent.

---

## Open Items

None. All NEEDS CLARIFICATION from the Technical Context are resolved. Cross-fleet RLS wiring through Prisma (item 2) is the highest-risk integration and is documented in `quickstart.md` for validation.
