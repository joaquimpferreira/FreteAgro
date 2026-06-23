# Implementation Plan: FreteAgro Mobile — App do Motorista

**Branch**: `002-fretagro-mobile` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-fretagro-mobile/spec.md`

## Summary

Build `fretagro-mobile`, a React Native / Expo driver app inside the `frete-agro` monorepo. Drivers can activate their account via invite link, register trips with leg-by-leg km tracking, log expenses and fuel refuels (offline-first via MMKV), view their acerto balance (read-only), and have all data automatically synced to the existing Supabase backend when connectivity is restored. The web dashboard (`fretagro-web`) gains two new Prisma models — `TrechoKm` and `Abastecimento` — that are written exclusively by the mobile app.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React Native via Expo SDK 51+

**Primary Dependencies**: Expo Router v3 (file-based routing), NativeWind v4 (Tailwind for RN), Zustand (global state), MMKV (local persistence), Supabase JS Client (auth + sync), expo-secure-store (auth token), expo-image-picker + expo-image-manipulator (camera), expo-haptics (haptic feedback), expo-network (connectivity), @expo-google-fonts/inter (typography), date-fns (dates), @fretagro/types (shared contracts)

**Storage**: MMKV for offline-first local persistence; PostgreSQL via Supabase for server state

**Testing**: Jest + React Native Testing Library (unit/integration); Maestro for E2E (optional v1)

**Target Platform**: Android (primary); iOS (optional Phase 2)

**Project Type**: Mobile app (Expo managed workflow)

**Performance Goals**: SplashScreen hidden only after MMKV load; FlatList for all unbounded lists; photo compressed to max 800 px / quality 0.7 before upload

**Constraints**: 100 % offline-capable for all driver write actions; auth token only in SecureStore; camera permission on-demand only; touch targets ≥ 44 px

**Scale/Scope**: ~8 screens, ~20 components, ~15 lib modules; targeted at fleets of 1–50 drivers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
*Use the checklist for the target package. Delete the unused block.*

### Web (fretagro-web)

- [ ] Layer dependency direction respected (`types` → `lib` → `hooks` → `components` → `app`)?
- [ ] New financial logic placed in `lib/finance/`?
- [ ] Auth checks restricted to `lib/auth/`?
- [ ] Monetary values stored as centavos integers?
- [ ] Truck–driver 1:1 constraint enforced at DB and lib layer?
- [ ] Soft-delete guard for freights with linked financial entries?
- [ ] Client Components (`"use client"`) justified and annotated with a comment?
- [ ] Row-level security (RLS) policies cover any new database tables?

### Mobile (fretagro-mobile)

- [x] Layer dependency direction respected (`@fretagro/types` → `lib` → `hooks` → `components` → `app`)? ✅ enforced by module structure in `fretagro-mobile/`
- [x] Trip/leg km logic isolated in `lib/viagem/`? ✅ `calcularTrecho.ts` + `calcularViagem.ts`
- [x] Financial logic imported from `lib/finance/` (shared); no duplicate? ✅ `calcularAcerto` stays in `packages/shared`; mobile reads only
- [x] Supabase calls encapsulated in `lib/sync/`? ✅ `syncViagem`, `syncDespesas`, `syncQueue` — no direct client calls in components or hooks
- [x] All driver field actions persist to MMKV before Supabase sync? ✅ `viagemStorage` + `queueStorage` written before any network call
- [x] Closed legs and trips blocked from re-opening at lib layer? ✅ guards in `calcularTrecho` + `calcularViagem` throw before persistence
- [x] Fuel value = `litros × preco_por_litro` (no manual total accepted)? ✅ `Abastecimento.valorTotal` computed, never accepted from input
- [x] Auth token stored in SecureStore only? ✅ `lib/supabase/client.ts` uses `expo-secure-store` adapter
- [x] Camera permission requested on-demand, not at app launch? ✅ only requested inside `capturarNota.ts` on user tap
- [x] Touch targets ≥ 44 px for all interactive elements? ✅ NativeWind `min-h-[44px]` on all `Pressable` / `TouchableOpacity`

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
fretagro-mobile/            ← new Expo package (this feature)
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── ativar.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── viagem/
│       │   ├── iniciar.tsx
│       │   ├── em-curso.tsx
│       │   ├── avancar-trecho.tsx
│       │   ├── encerrar.tsx
│       │   └── resumo.tsx
│       ├── despesas/
│       │   ├── abastecimento.tsx
│       │   └── geral.tsx
│       ├── historico/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       ├── acerto/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       └── perfil.tsx
├── components/
│   ├── ui/              (Button, Input, Badge, Card, OfflineBanner)
│   ├── viagem/          (TrechoCard, TrechoAtual, ViagemResumo)
│   ├── despesas/        (DespesaItem, FotoNota)
│   └── acerto/          (SaldoCard, AcertoItem)
├── lib/
│   ├── viagem/          (calcularTrecho.ts, calcularViagem.ts)
│   ├── sync/            (syncViagem.ts, syncDespesas.ts, syncQueue.ts)
│   ├── storage/         (viagemStorage.ts, queueStorage.ts)
│   ├── camera/          (capturarNota.ts)
│   └── supabase/        (client.ts)
├── hooks/
│   ├── useViagemAtiva.ts
│   ├── useConectividade.ts
│   ├── useSync.ts
│   └── useAcerto.ts
├── store/
│   └── viagemStore.ts
├── constants/
│   └── tokens.ts
├── app.config.ts
├── eas.json
├── tailwind.config.js
└── package.json

packages/shared/            ← new shared package @fretagro/types
├── package.json            (name: "@fretagro/types")
├── types/
│   ├── frota.ts
│   ├── frete.ts
│   ├── viagem.ts           ← TrechoKm, Abastecimento, ViagemAtiva (NEW)
│   ├── acerto.ts
│   └── auth.ts
└── lib/
    └── finance/
        └── calcularAcerto.ts

fretagro-web/prisma/schema.prisma   ← additive: TrechoKm + Abastecimento models
```

**Structure Decision**: Monorepo package layout. `fretagro-mobile` is a standalone Expo managed-workflow package. `packages/shared` is a new zero-dependency TypeScript package consumed by both `fretagro-web` and `fretagro-mobile`. The web Prisma schema is extended additively — no existing tables change.

## Complexity Tracking

> No constitution violations. All gates pass.
