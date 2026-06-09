<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Added sections:
  - Core Principles (7 principles, first-time fill)
  - Critical Business Rules
  - Quality Gates & Development Workflow
  - Governance
Modified principles: N/A (initial ratification — no prior version)
Templates requiring updates:
  - .specify/templates/plan-template.md  ✅ constitution-check gates align with principles below
  - .specify/templates/spec-template.md  ✅ requirements structure compatible; no mandatory section changes
  - .specify/templates/tasks-template.md ✅ task categories compatible; no principle-driven type changes
Follow-up TODOs: none — all placeholders resolved
-->

# FreteAgro Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

TypeScript strict mode (`strict: true`) MUST be enabled in `tsconfig.json`; implicit `any`
is forbidden — the TypeScript compiler MUST exit with zero errors on every commit.
Only functional components are allowed; class components MUST NOT be introduced.
All component props MUST be typed with named interfaces declared in `types/`.
Business logic MUST NOT live inside UI components — rules belong in `lib/` or custom
hooks in `hooks/`. Pure utility functions MUST be isolated in `lib/utils/` and be
independently testable without rendering. All identifiers, filenames, and comments
MUST use English; user-facing interface text MUST be written in Brazilian Portuguese.

### II. Architecture & Layer Separation

The dependency flow is strictly one-directional:
`types` → `lib` → `hooks` → `components` → `app (routes)`.
No layer may import from a layer above it.
Server Components are the default for all new route segments; Client Components
(`"use client"`) MUST only be introduced when browser interactivity or local state
is required — the justification MUST be noted in a code comment.
Authentication logic MUST be centralized in `lib/auth/`; session checks outside
that module are forbidden. Financial calculations (commission, settlement,
cash-flow) MUST live exclusively in `lib/finance/`; inline arithmetic on monetary
values inside components is forbidden.
Form data MUST be validated with Zod schemas before any database operation.

### III. Design System Compliance

All visual decisions MUST follow `design-system/DESIGN_SYSTEM.md` as the single
source of truth for colors, typography, and spacing. No hardcoded color values
outside `tokens.css` / `tokens.ts` are permitted.
Dark theme is the canonical default: background `#0D0D0D`, surfaces `#161616` and
`#1E1E1E`, primary action color green `#22C55E`.
The Inter typeface MUST be used project-wide.
Every component MUST be fully functional at 375 px viewport width (mobile-first).
Accessibility MUST meet WCAG AA contrast ratios; every `<input>` MUST have an
associated `<label>`; icon-only buttons MUST carry an `aria-label`.

### IV. Critical Business Rules (NON-NEGOTIABLE)

These rules encode legal and financial invariants and MUST be enforced at the
data-access layer as well as the UI:

- **1 truck = 1 driver**: A truck MUST NOT be linked to more than one active
  driver simultaneously. This constraint MUST be enforced at the database level
  (unique constraint) and at the `lib/` layer.
- **Settlement calculation**: Acerto MUST equal
  `(freight_value × commission_rate) − sum(deductions)`. All arithmetic MUST use
  integer centavos. The **single permitted rounding point** is `valorComissao =
  Math.round(valorFrete × percentualComissao / 100)` — fractional-cent rounding at
  the commission step only. `saldoFinal = valorComissao − totalDeducoes` MUST be
  exact with no further rounding.
- **Freight deletion**: A freight record that has any linked financial entries
  MUST NOT be hard-deleted; it MUST be soft-deleted (inactivated only).
- **Monetary storage**: All monetary values MUST be stored as integers (centavos)
  in the database. Conversion to reais (÷ 100) MUST happen only at the display layer.
- **Driver registration**: Drivers MUST be registered exclusively by the fleet owner
  (`dono`). Self-registration by drivers is forbidden.

### V. Performance

Images MUST be served through `next/image` for automatic optimization.
Any list that can grow beyond 50 rows (fretes, lançamentos, etc.) MUST use
server-side pagination — loading unbounded result sets is forbidden.
Dashboard aggregate data MUST be cached with `revalidate = 300` (5 minutes).
Every asynchronous operation visible to the user MUST display an explicit loading
state (skeleton, spinner, or disabled button with indicator).

### VI. Security

Every authenticated route MUST be protected by Next.js middleware; no authenticated
page may be accessible without a valid session — there are no exceptions.
Multi-tenancy isolation MUST be enforced via row-level security (RLS) at the
database level: a fleet owner (`dono`) MUST only be able to read and write records
belonging to their own fleet.
Server-side secrets MUST NOT be exposed to the client bundle. Environment variables
accessible in the browser MUST use the `NEXT_PUBLIC_` prefix only when strictly
required and the exposure is intentional and documented.
All user inputs MUST be sanitized and validated (Zod) before being passed to any
database query.

### VII. Deploy & Build Integrity

Vercel is the primary deployment platform.
All required environment variables MUST be documented in `.env.example` with
placeholder values and inline comments.
The database MUST be PostgreSQL, provisioned via Supabase.
The CI/CD pipeline MUST run `tsc --noEmit` and block deployment if TypeScript
reports any errors. A failing build MUST NOT be merged or deployed.

## Critical Business Rules Reference

The invariants listed under Principle IV are the contractual ground truth for the
entire system. Every feature spec, plan, and task list MUST cross-reference these
rules when implementing any logic related to drivers, trucks, freights, or financial
settlements. Deviations require an explicit architectural decision record (ADR) and
unanimous review approval.

## Quality Gates & Development Workflow

**Before merging any PR the following gates MUST all pass**:

1. `tsc --noEmit` exits with code 0 (zero TypeScript errors).
2. No ESLint errors (warnings allowed only for deferred TODO items tracked in issues).
3. All new business-logic code in `lib/` or `hooks/` has at least one unit test.
4. Zod validation is present for every form that writes to the database.
5. Mobile viewport (375 px) tested manually or via Playwright snapshot for any
   new or modified page.
6. No new hardcoded color values — only design-token references.

**Constitution Check** (to be included in every `plan.md`):

- [ ] Layer dependency direction respected (types → lib → hooks → components → app)?
- [ ] New financial logic placed in `lib/finance/`?
- [ ] Auth checks restricted to `lib/auth/`?
- [ ] Monetary values stored as centavos integers?
- [ ] Truck–driver 1:1 constraint enforced at DB and lib layer?
- [ ] Soft-delete guard for freights with financial entries?
- [ ] Client Components justified and annotated?
- [ ] RLS policies cover new tables?

## Governance

This constitution supersedes all other coding guidelines, README conventions, or
verbal agreements. In case of conflict, this document takes precedence.

**Amendment procedure**:

1. Open a PR with changes to this file and a bump to `CONSTITUTION_VERSION`.
2. Describe the rationale, the version bump type (MAJOR/MINOR/PATCH), and update
   `LAST_AMENDED_DATE` to the amendment date.
3. All dependent templates (plan, spec, tasks, commands) MUST be reviewed for
   alignment and updated in the same PR if impacted.
4. The PR requires at least one approving review before merge.

**Versioning policy**: Semantic versioning — MAJOR for principle removals or
incompatible redefinitions; MINOR for new principles or material expansions;
PATCH for clarifications, wording fixes, and non-semantic refinements.

**Compliance**: All PRs MUST verify the Quality Gates checklist above before
requesting review. Complexity beyond what the principles allow MUST be justified
in the `plan.md` Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-06-08 | **Last Amended**: 2026-06-08
