# Research: FreteAgro Mobile — App do Motorista

**Branch**: `002-fretagro-mobile` | **Date**: 2026-06-22

This document resolves all unknowns from the Technical Context phase.

---

## 1. Expo SDK Version & Managed Workflow

**Decision**: Expo SDK 51 with managed workflow (`expo-modules-core`).

**Rationale**: SDK 51 is the latest stable release that supports React Native 0.74, New Architecture (opt-in), and Expo Router v3. Managed workflow eliminates native build tooling overhead for the team, which has no existing React Native iOS/Android experience. EAS Build handles the native compilation.

**Alternatives considered**: SDK 50 (older, no benefit), bare workflow (unnecessary complexity for this feature set), React Native CLI (no Expo convenience layer).

---

## 2. Offline-First Architecture: MMKV + Sync Queue

**Decision**: Every driver write action: (1) persists immediately to MMKV via `viagemStorage` / `queueStorage`; (2) appends an idempotent operation descriptor to the sync queue; (3) `useConectividade` + `useSync` drain the queue in FIFO order when `expo-network` reports `isConnected = true`.

**Rationale**: MMKV is the fastest synchronous key-value store available for React Native (~10× faster than AsyncStorage). Supabase JS client does not support automatic offline queuing, so a manual queue is required. The Zustand store mirrors MMKV state in-memory for reactive UI updates without re-reading from disk on every render.

**Conflict resolution**: Last-write-wins using `updatedAt` (ISO timestamp attached to every queued operation). If the server record has a newer `updatedAt`, the local write is discarded. This is documented in `lib/sync/syncQueue.ts` as required by constitution M-III.

**Alternatives considered**: WatermelonDB (too heavy, complex schema migration), Apollo local state (GraphQL not used), custom CRDTs (over-engineering for this scale).

---

## 3. Auth Token Storage & Supabase Session

**Decision**: The Supabase JS client (`@supabase/supabase-js v2`) is configured with a custom `storage` adapter backed by `expo-secure-store`. The adapter maps `getItem` / `setItem` / `removeItem` to `SecureStore.getItemAsync` / `SecureStore.setItemAsync` / `SecureStore.deleteItemAsync`.

**Rationale**: Constitution M-VI forbids storing auth tokens in AsyncStorage or MMKV. SecureStore encrypts values using the device keychain (iOS) or Android Keystore. The Supabase client's `autoRefreshToken: true` and `persistSession: true` flags handle token refresh automatically without manual intervention.

**Alternatives considered**: AsyncStorage (forbidden by constitution), MMKV (forbidden by constitution), manual JWT management (Supabase already handles this).

---

## 4. NativeWind v4 Configuration

**Decision**: NativeWind v4 (`nativewind@^4.0`) with Tailwind CSS v3 config. `tailwind.config.js` imports color tokens from `design-system/tokens.ts` using `require()`, mapping them to Tailwind custom colors (e.g., `background: '#0D0D0D'`, `surface: '#161616'`, `primary: '#22C55E'`).

**Rationale**: NativeWind v4 uses the Babel plugin (`babel-plugin-nativewind`) and generates StyleSheets at build time from class names, avoiding runtime overhead. It aligns exactly with the web Tailwind config, enabling token sharing.

**Compatibility note**: NativeWind v4 requires `react-native-reanimated >= 3.x` and `react-native-safe-area-context >= 4.x` — both bundled with Expo SDK 51.

**Alternatives considered**: NativeWind v2 (deprecated for SDK 51), React Native Paper (Material Design, conflicts with design system), styled-components (heavier runtime).

---

## 5. Zustand Store Shape (`store/viagemStore.ts`)

**Decision**: A single Zustand store `useViagemStore` holds the complete `ViagemAtiva | null` state. Mutations are synchronous and always followed by a MMKV persist call. The store exposes: `iniciarViagem`, `avancarTrecho`, `registrarAbastecimento`, `registrarDespesa`, `encerrarViagem`, `hidratarFromStorage`.

**Rationale**: Zustand is lightweight (~1.3 kB) and has no provider wrapping requirement, simplifying the Expo Router layout tree. Keeping all viagem state in one slice avoids prop drilling across deeply nested screens (`em-curso`, `avancar-trecho`, `encerrar`).

**Alternatives considered**: Redux Toolkit (too heavy), Context API (re-render overhead for high-frequency updates like km input), Jotai (less familiar, similar trade-offs).

---

## 6. Expo Router v3 Auth Guard Pattern

**Decision**: Auth guard lives in `app/(app)/_layout.tsx` using the `Redirect` component from `expo-router`. On mount it checks if the Supabase session exists (read from SecureStore via the client adapter). If no session → redirect to `/(auth)/login`. The `(auth)` group is always accessible without a session check.

**Rationale**: Expo Router v3 recommends the layout-level redirect pattern over middleware (middleware is a Next.js concept not supported in Expo Router). The Supabase session check is synchronous relative to the SecureStore read, which is hydrated during the SplashScreen phase.

**Driver invite activation flow**: The invite link is a deep link `fretagroapp://ativar?token=<JWT>`. `app/(auth)/ativar.tsx` reads the token from the URL, calls `supabase.auth.verifyOtp({ type: 'invite', token })`, and then navigates to a password-set form.

---

## 7. Camera & Photo Compression

**Decision**: `expo-image-picker` with `mediaTypes: ['images']`, `allowsEditing: true`, `quality: 0.7`. After picking, `expo-image-manipulator` resizes to `maxWidth: 800, maxHeight: 800` with `compress: 0.7`. The resulting URI is uploaded to a private Supabase Storage bucket (`recibos`).

**Rationale**: Constitution M-VII mandates max 800 px / quality 0.7. `expo-image-manipulator` supports both resize and re-compress in a single call. Private bucket ensures cross-fleet isolation (constitution M-VI).

**Permission pattern**: `requestCameraPermissionsAsync()` is called inside `capturarNota.ts` only when the user taps "Foto da nota". Never at app launch (constitution M-VII).

---

## 8. Prisma Schema Extension — TrechoKm & Abastecimento

**Decision**: Add two models to `fretagro-web/prisma/schema.prisma`: `TrechoKm` and `Abastecimento` (definitions provided in the user arguments). Both carry `frotaId` for RLS row-level isolation. New Prisma migration generated via `prisma migrate dev`. Supabase RLS policies added to `rls-policies.sql`.

**Rationale**: The web dashboard needs to read km and fuel data from the mobile app. Adding to the existing schema is the simplest additive approach — no existing tables change.

**`Frete` relation**: `TrechoKm` has a required `freteId` FK; `Abastecimento` has a required `freteId` FK. Both extend the existing `Frete` model with back-relations (`trechos`, `abastecimentos`).

---

## 9. @fretagro/types Shared Package

**Decision**: Create `packages/shared/` as a new pnpm workspace package with `"name": "@fretagro/types"`. It exports TypeScript interfaces only (no runtime code except `calcularAcerto`). Both `fretagro-web` and `fretagro-mobile` add it as a workspace dependency (`"@fretagro/types": "workspace:*"`).

**Rationale**: Eliminates type duplication between web and mobile. The shared package has zero runtime dependencies — it is pure TypeScript interfaces + one finance function.

**Build**: No compilation step needed. Both consumers use `tsconfig.json` `paths` aliases to resolve `@fretagro/types` to `packages/shared/types/index.ts` at build time.

---

## 10. EAS Build Configuration

**Decision**: Three profiles in `eas.json`: `development` (debug APK, internal distribution), `preview` (release APK, internal distribution for testing), `production` (release APK, Google Play store). iOS profiles added but disabled (`distribution: "internal"`) pending Phase 2.

**Environment variables**: `app.config.ts` reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `process.env`. These are set in EAS Build secrets and `.env.local` for local development.

**OTA updates**: EAS Update configured for `production` channel only. Update check runs on app foreground via `expo-updates` hooks.

---

## 11. Trip Leg Calculation Rules

**Decision**: Implement in `lib/viagem/calcularTrecho.ts`:

```
kmRodado(trecho) = trecho.kmFinal - trecho.kmInicial  // only when fechadoEm != null
mediaDiesel(trecho, litros) = kmRodado / litros        // only diesel, not arla
kmTotalVazio = Σ kmRodado of trechos where tipo === 'vazio'
kmTotalCarregado = Σ kmRodado of trechos where tipo === 'carregado'
kmTotalViagem = kmTotalVazio + kmTotalCarregado
```

Guard: attempting to close a leg where `kmFinal <= kmInicial` throws a validation error. Attempting to mutate a leg where `fechadoEm != null` throws an immutability error. These guards run in `lib/viagem/` before any MMKV write.

**Alternatives considered**: Calculating totals on the server only (violates offline-first requirement — driver needs to see running totals while offline).
