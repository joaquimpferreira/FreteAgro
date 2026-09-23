# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Primary user: the **driver** ("motorista") of a Brazilian agricultural freight truck, employed by a small fleet owner. He does not choose this app — the fleet owner invites him via WhatsApp deep link and he uses it because his pay is calculated from what he records in it.

Confirmed operating profile:

- **Smartphone familiarity is low** — WhatsApp and little else. The app cannot assume app-literate conventions: hidden tabs, unlabeled icons, swipe gestures, long-press, and bottom-sheet idioms are not available vocabulary. Every action needs a written label and one obvious path.
- **Device is an entry-level Android** — Moto G / Samsung A class, ~6" screen, limited RAM and GPU. Android is the single shipped platform (EAS builds are `--platform android` only; the repo has `android/` and no `ios/`).
- **The app is opened standing still, outdoors** — at the fuel pump and in the loading/unloading yard, truck stopped, frequently in direct Mato Grosso sunlight. It is not used while driving.

Secondary role (not a user of this surface): the fleet owner uses the separate `fretagro-web` panel. The boundary is read/write — the driver's app originates field data, the owner's panel decides on it.

## Product Purpose

The driver app captures, from the roadside, the two facts that determine what the driver gets paid: **odometer readings per leg** (trecho) and **expenses incurred on the trip** (fuel, tolls, advances, workshop). It replaces the paper notebook and the WhatsApp photo of a scribbled number.

Success is: the driver records a fuel stop or closes a leg in seconds, standing at the pump, without signal, and later sees a settlement (acerto) balance he recognizes and does not dispute.

## Positioning

The record is made **where the fact happens**, not reconstructed later from memory. The offline-first queue means the absence of signal — the normal condition on a Mato Grosso highway — never blocks a record and never loses one. The driver's own settlement balance is visible to him in the same app that captured the numbers behind it, which is what removes the owner/driver pay dispute the product exists to end.

## Operating Context

- **Offline is the default assumption, not an error state.** Every write goes to an MMKV-backed Zustand store first and an idempotent sync queue second; queued operations carry client-generated cuids so replay is safe. Data must be visible offline within 2s of app open (SC-003).
- The trip model: a `Frete` (origem → destino, tipo de carga, valor bruto from the Carta Frete) contains ordered `TrechoKm` legs, each `vazio` or `carregado`, each with kmInicial/kmFinal. Expenses attach to the trip: `Abastecimento` (litros × preço/litro, optional photo of the nota) and `Lancamento` (typed expense, optional photo).
- Trip status cycle: `em andamento → concluído → acerto pendente → acerto realizado`.
- The settlement formula, single rounding point: `valorComissao = round(valorFrete × percentualComissao / 100)`; `saldoFinal = valorComissao − totalDeducoes`. The driver's app shows this as a **read-only estimate**; the owner's panel performs the authoritative calculation.
- Photos of fuel receipts (notas) are captured in-app and uploaded when signal returns.
- The corporate network in use intercepts TLS; requests can fail silently against an untrusted proxy CA. This is an environment condition, not an app defect.

## Capabilities and Constraints

- Stack: Expo SDK 51, React Native 0.74, expo-router v3 (file-based), Zustand + `react-native-mmkv`, Supabase JS, NativeWind 4, `@expo-google-fonts/inter`, `expo-haptics`, `expo-image-picker`, Jest + Testing Library.
- Governed by `.specify/memory/constitution.md`: money as integer centavos; layered import discipline (`types → lib → hooks → components → app`); auth only through `lib/auth/`, never importing the Supabase client directly from a screen; design tokens only, no hardcoded colors; Inter typeface; touch targets ≥ 44px (M-Touch).
- 15 screens, contracted in `specs/002-fretagro-mobile/contracts/screens.md`: login, activation, home, start/active/advance/close/summary trip, fuel expense, general expense, history list + detail, acerto list + detail, profile.
- **Performance is a design constraint, not an optimization.** Entry-level Android means real-time blur, large shadow stacks, heavy list re-renders, and continuous animation are off the table.
- Account activation (`(auth)/ativar.tsx`) is specified but not present in the codebase; two driver-onboarding flows disagree in the backend (owner-set password vs. OTP invite). Treat activation as an **undecided product fact** — do not design a flow that assumes one of them until the owner confirms which is authoritative.

## Brand Commitments

Name: FreteAgro. Brand green is shared across every surface: `#16b84f` (signal) with `#1bde5f` as its brighter sibling for luminance on black. Typeface is Inter.

The user has pinned a binding visual reference: the driver-screen recreation in `fretagro-web/components/marketing/mockups/MobileMockup.tsx`, built in the marketing surface's "Estrada à Noite" world (`fretagro-web/DESIGN.md`). A fleet-inspection app reference was supplied as a secondary source for possible additions (status chips, metric tiles, circular icon buttons, segmented controls). These are recorded here as given; how they are adapted to a sunlit, low-literacy, entry-level-Android surface is a design decision, not a product fact.

**Standing preference — convention over invention.** Offered a choice of visual worlds for the driver app, the user chose the category standard: Material 3 played straight, with no smuggled quirk. This is a durable preference, not a one-off: future work on this surface executes the platform convention at full fidelity rather than proposing a distinct visual world, unless the user reopens it.

**Craft bar.** The user named driver-facing gig apps — 99 Motorista, Uber Driver, iFood Entregador — as the finish level this app must reach. Their disciplines are the bar: one primary action per screen, state always visible without scrolling, figures set large enough to read at arm's length, and no hidden convention.

## Evidence on Hand

- Real business logic and data model: `specs/002-fretagro-mobile/` (spec, data-model, screen contracts) and `packages/shared/types`.
- Real figures only exist as seeded/illustrative data. The mockup's numbers (Sorriso/MT → Rondonópolis/MT, 128.940 km, R$ 1.242,00) are illustrative and must not be presented as real fleet data.
- No driver testimonials, no usage metrics, no app-store presence. Do not fabricate any.

## Product Principles

- **Record at the source.** The value of this app is that the number is entered where and when it happens; anything that adds friction at the pump costs the product its reason to exist.
- **Offline is a normal state, not a failure.** It is shown as a calm, persistent fact — never as an error the driver must resolve.
- **The driver must recognize his own money.** Every figure that feeds the settlement is traceable by him back to something he personally recorded.
- **Design to the floor, not the average.** Low smartphone familiarity, bright sun, and a cheap screen are the shipping conditions; a design that only works indoors on a good phone has not shipped.
- **Never invent a number.** Estimates are labeled as estimates; the owner's panel is authoritative on pay.

## Accessibility & Inclusion

- WCAG AA contrast is the project-wide floor (constitution), but this surface is read **in direct sunlight on a low-brightness LCD** — the effective contrast requirement is higher than AA indoors, and low-opacity text tiers that pass on a desktop monitor do not pass here.
- Touch targets ≥ 44px (constitution M-Touch), with the real scene being a standing driver, possibly one-handed, with dirty or gloved hands.
- Text labels accompany every icon; no meaning is carried by icon or color alone.
- Portuguese (pt-BR) only. Currency, distances, and dates in Brazilian formats.
