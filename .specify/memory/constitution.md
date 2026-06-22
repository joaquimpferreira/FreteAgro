<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Version bump type: MINOR — new Mobile Package section (fretagro-mobile) added with 7 principles
  (M-I through M-VII); Shared Business Rules section promoted from web-only scope; Quality Gates
  extended with mobile-specific gates and a Mobile Constitution Check block.
Modified principles: None — existing web principles I–VII unchanged.
Added sections:
  - Scope (monorepo overview)
  - Mobile Package — fretagro-mobile (M-I through M-VII)
  - Shared Business Rules (replaces "Critical Business Rules Reference")
  - Mobile Constitution Check (inside Quality Gates)
  - Mobile Quality Gates (inside Quality Gates)
Templates requiring updates:
  - .specify/templates/plan-template.md  ✅ updated — Mobile Constitution Check gates added
  - .specify/templates/spec-template.md  ✅ compatible; no mandatory section changes required
  - .specify/templates/tasks-template.md ✅ compatible; no principle-driven type changes required
Follow-up TODOs: none — all placeholders resolved.
-->

# FreteAgro Monorepo Constitution

## Scope

This constitution governs all packages in the `frete-agro` monorepo:

- **`fretagro-web`** — Next.js 14 web panel for fleet owners (`dono`)
- **`fretagro-mobile`** — React Native (Expo) app for drivers (`motorista`)
- **`@fretagro/types`** — Shared TypeScript contracts (source of truth for all data models)
- **`design-system/`** — Shared visual tokens (colors, typography, spacing)

Sections titled *Web Package* apply exclusively to `fretagro-web`.
Sections titled *Mobile Package* apply exclusively to `fretagro-mobile`.

---

## Web Package — fretagro-web

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

---

## Mobile Package — fretagro-mobile

### M-I. Code Quality (NON-NEGOTIABLE)

TypeScript strict mode (`strict: true`) MUST be enabled; implicit `any` is forbidden —
the TypeScript compiler MUST exit with zero errors on every commit.
Only functional components are allowed; class components MUST NOT be introduced.
All component props and data contracts MUST be typed using interfaces from
`@fretagro/types` — redeclaring locally any type that already exists in the shared
package is forbidden.
Business logic MUST NOT live inside UI components — all rules belong in `lib/` or
custom hooks in `hooks/`. All identifiers, filenames, and comments MUST use English;
user-facing interface text MUST be written in Brazilian Portuguese.

### M-II. Architecture & Layer Separation

The dependency flow is strictly one-directional:
`@fretagro/types` → `lib/` → `hooks/` → `components/` → `app/` (Expo Router routes).
No layer may import from a layer above it.
Expo Router v3 is the navigation solution — file-based routing MUST be used;
manual React Navigation configuration outside Expo Router is forbidden.
State persistence MUST use MMKV for local storage — driver actions MUST be saved
locally first and synced to Supabase when connectivity is restored (offline-first).
Trip and leg (trecho) distance calculations MUST be isolated in `lib/viagem/`;
inline km arithmetic inside components is forbidden.
Financial calculations MUST be imported from `lib/finance/` (shared with
`fretagro-web` when applicable); duplicate financial logic across packages is
forbidden.
All Supabase interactions MUST be encapsulated in `lib/sync/`; components and hooks
MUST NOT call the Supabase client directly.

### M-III. Offline-First (NON-NEGOTIABLE)

Every driver action performed in the field — starting a trip, advancing a leg,
recording an expense — MUST work 100% without internet connectivity.
Data MUST be persisted to MMKV immediately upon user confirmation; the Supabase
sync queue is processed only when connectivity is detected.
A connection-status indicator MUST be permanently visible in the UI whenever the
device is offline; this indicator MUST NOT be hidden or suppressed by any other
UI state.
Synchronization conflicts MUST be resolved with last-write-wins using the action
timestamp; the conflict resolution strategy MUST be documented in `lib/sync/`.

### M-IV. Critical Mobile Business Rules (NON-NEGOTIABLE)

These rules govern driver workflows and MUST be enforced in `lib/` before any
persistence call:

- **1 driver = 1 truck**: A driver MUST NOT start a trip without an active truck
  assignment. Initiating a viagem with no `caminhaoId` linked to the authenticated
  driver MUST be blocked at the `lib/` layer.
- **Trip legs (TrechoKm)**: A viagem is composed of one or more `TrechoKm` records.
  Each trecho MUST carry: `tipo` (`vazio` | `carregado`), `km_inicial`, and
  `km_final` (set on leg closure). Km total vazio = sum of km from all `vazio`
  legs; km total carregado = sum of km from all `carregado` legs.
- **Fuel consumption**: Average consumption per leg = `km_rodado / litros_diesel`.
  This calculation MUST only be performed when a diesel refuel is linked to the
  leg. The `arla` sub-type is tracked separately within the `combustivel` category
  and MUST NOT be used in consumption calculations.
- **Fuel value calculation**: Refuel value MUST be calculated as
  `litros × preco_por_litro`. Accepting a manual `valor_total` for fuel is
  forbidden; the multiplication MUST always be explicit and auditable.
- **Immutable closure**: A leg (`TrechoKm`) with `km_final` set MUST NOT be
  reopened or modified. A viagem with status `encerrada` MUST NOT be reopened.
  These constraints MUST be enforced at the `lib/` layer before any persistence
  call.

### M-V. Design & Accessibility

All visual decisions MUST reference `design-system/DESIGN_SYSTEM.md` and the shared
`tokens.ts` as the single source of truth. No hardcoded color values are permitted.
Dark theme is the canonical default: background `#0D0D0D`, surfaces `#161616` and
`#1E1E1E`, primary action green `#22C55E` — matching the web.
Styling MUST use NativeWind (Tailwind for React Native); direct `StyleSheet` usage
is only permitted when NativeWind cannot cover the use case, with a code comment
explaining why.
The Inter typeface MUST be loaded via `expo-google-fonts`.
Every interactive element MUST have a minimum touch target of 44 px height (WCAG
mobile). Haptic feedback (`expo-haptics`) MUST be triggered on destructive actions
(deletions, cancellations) and on important confirmations.

### M-VI. Performance & Security

**Performance**:
Lists of trips and expenses MUST use `FlatList`; using `ScrollView` to render an
unbounded list of items is forbidden.
Receipt photos MUST be compressed before upload (max 800 px longest edge, quality
0.7).
All database and storage operations MUST be asynchronous; no blocking I/O on the
main thread is allowed.
The SplashScreen MUST remain visible until local MMKV data has been loaded and the
app is ready to render.

**Security**:
Authentication tokens MUST be stored exclusively in `expo-secure-store`
(SecureStore). Storing tokens in AsyncStorage or MMKV is forbidden.
A driver MUST only access data belonging to their own fleet and their own truck;
cross-fleet data access MUST be blocked both at `lib/sync/` and by Supabase RLS.
All photo uploads MUST target a private Supabase Storage bucket; public bucket
uploads are forbidden.

### M-VII. Camera, Files & Deploy

**Camera & Files**:
Receipt photos MUST be captured exclusively via `expo-image-picker`.
Camera permission MUST be requested on-demand — only when the user explicitly
taps "Foto da nota" (or equivalent). Requesting camera permission at app launch is
forbidden.
Photo compression (max 800 px, quality 0.7) MUST be applied before any upload call.

**Deploy**:
APK and IPA builds MUST be generated via Expo EAS Build.
Over-the-air (OTA) updates MUST be distributed via Expo EAS Update.
All environment variables MUST be defined in `app.config.ts` and `eas.json`;
hardcoded credentials, URLs, or keys in source files are forbidden.

---

## Shared Business Rules

The invariants in Principle IV (web) and M-IV (mobile) are the contractual ground
truth for the entire system. Every feature spec, plan, and task list across both
packages MUST cross-reference these rules when implementing any logic related to
drivers, trucks, trips, or financial settlements. Deviations require an explicit
architectural decision record (ADR) and unanimous review approval.

## Quality Gates & Development Workflow

**Before merging any PR the following gates MUST all pass**:

### Web (fretagro-web)

1. `tsc --noEmit` exits with code 0 (zero TypeScript errors).
2. No ESLint errors (warnings allowed only for deferred TODO items tracked in issues).
3. All new business-logic code in `lib/` or `hooks/` has at least one unit test.
4. Zod validation is present for every form that writes to the database.
5. Mobile viewport (375 px) tested manually or via Playwright snapshot for any
   new or modified page.
6. No new hardcoded color values — only design-token references.

### Mobile (fretagro-mobile)

1. `tsc --noEmit` exits with code 0 (zero TypeScript errors).
2. No ESLint errors (warnings allowed only for deferred TODO items tracked in issues).
3. All new `lib/` and `hooks/` code has at least one unit test.
4. Offline scenario manually tested: action performed in airplane mode verifies
   MMKV write; data visible after restoring connectivity.
5. Touch targets verified ≥ 44 px for any new interactive element.
6. No new hardcoded color values — only design-token references.
7. No camera, location, or storage permissions requested at app launch — all
   on-demand.

**Web Constitution Check** (to be included in every `plan.md` for fretagro-web):

- [ ] Layer dependency direction respected (types → lib → hooks → components → app)?
- [ ] New financial logic placed in `lib/finance/`?
- [ ] Auth checks restricted to `lib/auth/`?
- [ ] Monetary values stored as centavos integers?
- [ ] Truck–driver 1:1 constraint enforced at DB and lib layer?
- [ ] Soft-delete guard for freights with financial entries?
- [ ] Client Components justified and annotated?
- [ ] RLS policies cover new tables?

**Mobile Constitution Check** (to be included in every `plan.md` for fretagro-mobile):

- [ ] Layer dependency direction respected (@fretagro/types → lib → hooks → components → app)?
- [ ] Trip/leg km logic isolated in `lib/viagem/`?
- [ ] Financial logic imported from `lib/finance/` (shared); no duplicate?
- [ ] Supabase calls encapsulated in `lib/sync/`; no direct calls from components or hooks?
- [ ] All driver field actions persist to MMKV before Supabase sync?
- [ ] Closed legs and trips blocked from re-opening at lib layer?
- [ ] Fuel value = `litros × preco_por_litro` (no manual total accepted)?
- [ ] Auth token stored in SecureStore only?
- [ ] Camera permission requested on-demand, not at app launch?
- [ ] Touch targets ≥ 44 px for all interactive elements?

## Governance

This constitution supersedes all other coding guidelines, README conventions, or
verbal agreements across all packages in the monorepo. In case of conflict, this
document takes precedence.

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

**Compliance**: All PRs MUST verify the relevant Quality Gates checklist (web or
mobile) before requesting review. Complexity beyond what the principles allow MUST
be justified in the `plan.md` Complexity Tracking table.

**Version**: 1.1.0 | **Ratified**: 2026-06-08 | **Last Amended**: 2026-06-22
