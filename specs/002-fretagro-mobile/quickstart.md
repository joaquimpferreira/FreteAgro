# Quickstart & Validation Guide: FreteAgro Mobile

**Branch**: `002-fretagro-mobile` | **Date**: 2026-06-22
**Contracts**: [contracts/screens.md](contracts/screens.md) | **Data Model**: [data-model.md](data-model.md)

This guide covers how to run the app locally and validate each user story end-to-end. It is a **run/test guide** — implementation code lives in `tasks.md`.

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | ≥ 20 LTS |
| pnpm | ≥ 9 (`corepack enable && corepack prepare pnpm@latest --activate`) |
| Expo CLI | `pnpm add -g expo-cli` or via `npx expo` |
| EAS CLI | `pnpm add -g eas-cli` (required for EAS Build/Update only) |
| Android emulator | Android Studio + AVD, API 33+, or physical device with USB debugging |
| Supabase project | Existing project from `fretagro-web`; URL + anon key required |

---

## Setup

### 1. Install workspace dependencies
export NODE_EXTRA_CA_CERTS=/tmp/mac-ca-combined.pem && cd /Users/joaquim.cardoso/Documents/FreteAgro/frete-agro/fretagro-mobile && npx expo start --reset-cache
```bash
# From monorepo root
pnpm install
```

### 2. Environment variables

Create `fretagro-mobile/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 3. Apply Prisma migrations (in `fretagro-web/`)

```bash
cd fretagro-web
npx prisma migrate dev --name add_trecho_km_abastecimento
npx prisma generate
```

Expected: migration applied; `TrechoKm` and `Abastecimento` tables created in Supabase.

### 4. Apply RLS policies

```bash
# Run in Supabase SQL editor or via psql
psql $DATABASE_URL < fretagro-web/prisma/rls-policies.sql
```

Expected: `trechos_km` and `abastecimentos` have RLS enabled with fleet-isolation policies.

### 5. Start the Expo dev server

```bash
cd fretagro-mobile
npx expo start --android
```

Press `a` to launch the Android emulator. The app should open on the login screen.

---

## Validation Scenarios

### Story 1 — Account Activation & Login

**Setup**: In the web dashboard, register a driver with a WhatsApp number and send an invite link.

**Steps**:
1. Open the invite deep link on the emulator: `adb shell am start -a android.intent.action.VIEW -d "fretagroapp://ativar?token=<JWT>"`
2. Set a password on the activation screen.
3. Confirm the fleet name is visible on the login screen.
4. Log in with the new password.

**Expected**: App navigates to the home screen. Closing and reopening the app skips the login screen.

---

### Story 2 — Register a Complete Trip

**Setup**: Logged-in driver with a linked truck.

**Steps**:
1. Home screen → tap "Iniciar viagem".
2. Fill: origem "Fazenda São João", destino "Porto Alegre", tipoCarga "grao", kmInicial 12000.
3. Confirm → app navigates to `em-curso` panel.
4. Tap "Avançar trecho" → enter kmFinal 12150 (vazio leg closes; km_rodado = 150).
5. Enter tipoProximoTrecho = "carregado", kmInicial = 12150 → new leg opens.
6. Tap "Avançar trecho" again → enter kmFinal 12600 (carregado leg closes; km_rodado = 450).
7. Tap "Encerrar viagem" → confirm final km 12650 (km_rodado last leg = 50).
8. View summary screen.

**Expected**:
- kmTotalVazio = 150, kmTotalCarregado = 500, kmTotalViagem = 650.
- Trip appears in history list.
- After sync: rows visible in Supabase `trechos_km` table.

---

### Story 3 — Register Expenses During a Trip

**Setup**: Active trip (from Story 2 steps 1–4).

**Steps**:
1. Tap "Abastecer" → select "diesel", litros = 80, precoPorLitro = R$6.50 → confirm.
   - Expected: valorTotal = R$520.00 (52000 centavos) shown automatically.
2. Tap "Abastecer" → select "arla", litros = 10, precoPorLitro = R$4.20 → confirm.
3. Tap "Despesa" → select "pedagio", valor = R$12.50 → confirm.
4. Tap "Despesa" → select "borracharia", valor = R$150.00, add photo → confirm.
5. View expense list on `em-curso` panel.

**Expected**:
- 4 items listed; running total = R$682.50.
- Diesel refuel: mediaDiesel calculated when leg is closed.
- Arla refuel: tracked separately; NOT included in mediaDiesel.
- Submitting litros = 0 OR precoPorLitro = 0 → form blocked with validation error.

---

### Story 4 — Offline Operation & Automatic Sync

**Setup**: Active trip started while online.

**Steps**:
1. Enable airplane mode on the device.
2. Tap "Avançar trecho" → enter kmFinal → confirm.
   - Expected: action completes; `OfflineBanner` visible; pending sync count shows 1+.
3. Register one diesel refuel and one general expense.
   - Expected: both saved locally; pending sync count increases.
4. Disable airplane mode.
   - Expected (within 30 s): sync completes automatically; pending count → 0; `OfflineBanner` hides.
5. Open Supabase table `trechos_km` → rows appear.

---

### Story 5 — Trip History & Detail

**Setup**: At least one closed trip.

**Steps**:
1. Navigate to "Histórico" tab.
2. Verify list shows: date, "Fazenda São João → Porto Alegre", acerto status = "pendente".
3. Tap the trip.

**Expected**:
- Detail screen shows all trechos (km each + tipo).
- All expenses and refuels listed with values.
- If acerto exists: summary (valorComissao, totalDeducoes, saldoFinal) visible.

---

### Story 6 — My Acerto

**Setup**: Fleet owner has created and settled an acerto for the driver in the web dashboard.

**Steps**:
1. Navigate to "Meu Acerto" tab.
2. Verify pending balance shows: valorComissao, totalDeducoes, saldoFinal.
3. Tap settled acerto in history.

**Expected**: Receipt visible (if comprovanteUrl set).

---

### Story 7 — Home Screen States

**Steps**:
1. With active trip: home shows active trip banner with route and "Continuar" CTA.
2. Without active trip: home shows "Nenhuma viagem em andamento" and "Iniciar viagem" CTA.
3. Enable airplane mode → `OfflineBanner` appears immediately; no other UI suppresses it.
4. Pending acerto balance visible on home without navigating to "Meu Acerto".

---

### Story 8 — Driver Profile

**Steps**:
1. Navigate to "Perfil" tab.
2. Verify nome, whatsapp, truck plate + model, percentualComissao match web registration.
3. Tap "Sair" → confirm.

**Expected**: Navigates to login screen; session cleared.

---

## Edge Case Validations

| Edge Case | How to validate |
|---|---|
| km final < km inicial | Enter kmFinal = 11999 when kmInicial = 12000 → form blocked with error |
| Advance leg with open prior leg | Not reachable by design — only one leg open at a time |
| Start trip with no truck assigned | Unlink truck in web dashboard → "Iniciar viagem" blocked with message |
| Expired invite link | Use expired JWT → `ativar.tsx` shows error screen |
| Refuel with only litros filled | Submit with precoPorLitro = 0 → form blocked |
| No expenses on close | Close trip with 0 expenses → flows normally to summary |
| App force-close mid-trip | Force-close app; reopen → active trip restored from MMKV |

---

## EAS Build (Android APK)

```bash
cd fretagro-mobile

# Development APK (debug)
eas build --platform android --profile development

# Preview APK (release, internal)
eas build --platform android --profile preview
```

Download the APK from the EAS dashboard and install on a physical device:

```bash
adb install fretagro-mobile.apk
```
