# Screen Contracts: FreteAgro Mobile

**Branch**: `002-fretagro-mobile` | **Date**: 2026-06-22

This document lists every screen in the app, its route path, the data it reads, the actions it exposes, and the navigation outcomes. It also defines the Zustand store mutation signatures and sync queue operation schemas.

---

## Screen Contracts

### 1. Login (`app/(auth)/login.tsx`)

| | |
|---|---|
| **Route** | `/(auth)/login` |
| **Guard** | None — accessible when unauthenticated |
| **Reads** | Fleet name (from deep-link params or Supabase query) |
| **Actions** | `supabase.auth.signInWithPassword({ email, password })` |
| **On success** | Navigate to `/(app)/` |
| **On error** | Display inline error message; no session created |

---

### 2. Account Activation (`app/(auth)/ativar.tsx`)

| | |
|---|---|
| **Route** | `/(auth)/ativar?token=<JWT>` |
| **Guard** | None — accessed via invite deep link |
| **Reads** | `token` from URL params |
| **Actions** | (1) `supabase.auth.verifyOtp({ type: 'invite', token })` → (2) set password form → (3) `supabase.auth.updateUser({ password })` |
| **On success** | Navigate to `/(app)/` |
| **On expired link** | Display error: "Link inválido ou expirado. Solicite um novo convite ao dono da frota." |

---

### 3. Home (`app/(app)/index.tsx`)

| | |
|---|---|
| **Route** | `/(app)/` |
| **Guard** | Auth guard in `(app)/_layout.tsx` |
| **Reads** | `useViagemStore.viagem` (active trip); `useAcerto()` pending balance |
| **Shows** | Active trip banner (with "Continuar" CTA) OR "Nenhuma viagem" + "Iniciar viagem" CTA; pending acerto balance; `OfflineBanner` when offline |
| **Actions** | Navigate to `/(app)/viagem/em-curso` (continuar); Navigate to `/(app)/viagem/iniciar` (iniciar) |

---

### 4. Start Trip (`app/(app)/viagem/iniciar.tsx`)

| | |
|---|---|
| **Route** | `/(app)/viagem/iniciar` |
| **Guard** | No active trip (blocked with message if one exists); driver must have `caminhaoId` |
| **Input** | origem (string), destino (string), tipoCarga (enum), kmInicial (int), valorBruto (int centavos, optional — from Carta Frete, defaults to 0), caminhaoId (pre-filled from driver profile), motoristaId (from session) |
| **Validation** | origem, destino, tipoCarga, kmInicial required; kmInicial > 0; valorBruto ≥ 0 |
| **Actions** | `useViagemStore.iniciarViagem(params)` → persists to MMKV → queues `CREATE_VIAGEM` + `CREATE_TRECHO` |
| **On success** | Navigate to `/(app)/viagem/em-curso` |

---

### 5. Active Trip Panel (`app/(app)/viagem/em-curso.tsx`)

| | |
|---|---|
| **Route** | `/(app)/viagem/em-curso` |
| **Guard** | Active trip must exist |
| **Reads** | `useViagemStore.viagem`; current open trecho |
| **Shows** | `TrechoAtual` component; `TrechoCard` list for closed legs; running expense total; `OfflineBanner`; pending sync count |
| **Actions** | "Avançar trecho" → `/(app)/viagem/avancar-trecho`; "Encerrar viagem" → `/(app)/viagem/encerrar`; "Abastecer" → `/(app)/despesas/abastecimento`; "Despesa" → `/(app)/despesas/geral` |

---

### 6. Advance Leg (`app/(app)/viagem/avancar-trecho.tsx`)

| | |
|---|---|
| **Route** | `/(app)/viagem/avancar-trecho` |
| **Guard** | Active trip with open leg |
| **Input** | kmFinal (int), tipoProximoTrecho ('vazio' \| 'carregado') |
| **Validation** | kmFinal > current leg kmInicial |
| **Actions** | `useViagemStore.avancarTrecho(kmFinal)` → `abrirNovoTrecho(tipo, kmFinal)` → persists to MMKV → queues `CLOSE_TRECHO` + `CREATE_TRECHO` |
| **On success** | Navigate back to `/(app)/viagem/em-curso` |

---

### 7. Close Trip (`app/(app)/viagem/encerrar.tsx`)

| | |
|---|---|
| **Route** | `/(app)/viagem/encerrar` |
| **Guard** | Active trip with open leg |
| **Input** | kmFinal (int) for the last leg |
| **Shows** | Summary: kmTotalVazio, kmTotalCarregado, kmTotalViagem, total expenses |
| **Validation** | kmFinal > current leg kmInicial; driver must confirm |
| **Actions** | `useViagemStore.encerrarViagem(kmFinal)` → persists to MMKV → queues `CLOSE_TRECHO` + `CLOSE_VIAGEM` |
| **On success** | Navigate to `/(app)/viagem/resumo` |

---

### 8. Trip Summary (`app/(app)/viagem/resumo.tsx`)

| | |
|---|---|
| **Route** | `/(app)/viagem/resumo` |
| **Guard** | Must be navigated to from `encerrar`; viagem is closed |
| **Shows** | Full trip breakdown: all trechos (km each + tipo), all expenses, all refuels, mediaDiesel per leg, kmTotal totals |
| **Actions** | "Ir para histórico" → `/(app)/historico`; "Ir para início" → `/(app)/` |

---

### 9. Fuel Expense (`app/(app)/despesas/abastecimento.tsx`)

| | |
|---|---|
| **Route** | `/(app)/despesas/abastecimento` |
| **Guard** | Active trip |
| **Input** | subtipo ('diesel' \| 'arla'), litros (decimal > 0), precoPorLitro (decimal > 0), local (optional string), kmAtual (optional int), foto (optional) |
| **Computed** | valorTotal = round(litros × precoPorLitro × 100) — shown in real time |
| **Actions** | `useViagemStore.registrarAbastecimento(data)` → persists to MMKV → queues `CREATE_ABASTECIMENTO` |
| **On success** | Navigate back to `/(app)/viagem/em-curso` |

---

### 10. General Expense (`app/(app)/despesas/geral.tsx`)

| | |
|---|---|
| **Route** | `/(app)/despesas/geral` |
| **Guard** | Active trip |
| **Input** | tipo (TipoLancamento enum), valor (int centavos), descricao (optional), foto (optional) |
| **Validation** | valor > 0; tipo required |
| **Actions** | `useViagemStore.registrarDespesa(data)` → persists to MMKV → queues `CREATE_LANCAMENTO` |
| **On success** | Navigate back to `/(app)/viagem/em-curso` |

---

### 11. Trip History (`app/(app)/historico/index.tsx`)

| | |
|---|---|
| **Route** | `/(app)/historico` |
| **Reads** | `useSync` synced Supabase data; fetched via `lib/sync/` |
| **Shows** | `FlatList` of closed trips: date, origem→destino, acerto status badge |
| **Actions** | Tap row → `/(app)/historico/[id]` |

---

### 12. Trip Detail (`app/(app)/historico/[id].tsx`)

| | |
|---|---|
| **Route** | `/(app)/historico/:id` |
| **Reads** | `Frete` + `TrechoKm[]` + `Lancamento[]` + `Abastecimento[]` + `Acerto?` for given `id` |
| **Shows** | All trechos with kmRodado + mediaDiesel (if available); all expenses grouped by type; acerto summary if realized |

---

### 13. My Acerto (`app/(app)/acerto/index.tsx`)

| | |
|---|---|
| **Route** | `/(app)/acerto` |
| **Reads** | `useAcerto()` — fetches from Supabase via `lib/sync/` |
| **Shows** | Pending balance: valorComissao, totalDeducoes, saldoFinal; history list of settled acertos |
| **Actions** | Tap settled acerto → `/(app)/acerto/[id]` |

---

### 14. Acerto Detail (`app/(app)/acerto/[id].tsx`)

| | |
|---|---|
| **Route** | `/(app)/acerto/:id` |
| **Reads** | Full `Acerto` + `comprovanteUrl` |
| **Shows** | Settlement breakdown; receipt image (if `comprovanteUrl` present) |

---

### 15. Profile (`app/(app)/perfil.tsx`)

| | |
|---|---|
| **Route** | `/(app)/perfil` |
| **Reads** | Authenticated `Motorista` record from Supabase session |
| **Shows** | nome, whatsapp, truck plate + model, percentualComissao |
| **Actions** | "Sair" → confirm → `supabase.auth.signOut()` → redirect to `/(auth)/login` |

---

## Zustand Store Mutations (store/viagemStore.ts)

```typescript
iniciarViagem(params: {
  freteId: string       // generated on mobile (cuid) — this IS the new Frete record id
  origem: string
  destino: string
  tipoCarga: TipoCarga
  kmInicial: number
  valorBruto: number    // centavos; from Carta Frete; 0 if not yet known
  caminhaoId: string    // pre-filled from driver profile
  motoristaId: string   // from auth session
  frotaId: string       // from auth session
}): void
// Creates Frete record locally + opens first vazio TrechoKm;
// enqueues CREATE_VIAGEM + CREATE_TRECHO

avancarTrecho(kmFinal: number): void
// Closes current open leg; validates kmFinal > kmInicial

abrirNovoTrecho(tipo: 'vazio' | 'carregado', kmInicial: number): void
// Opens next leg with ordem = previous + 1

encerrarViagem(kmFinal: number): void
// Closes last leg; sets viagem.pendenteSincronizacao = true

registrarAbastecimento(
  data: Omit<Abastecimento, 'id' | 'createdAt' | 'valorTotal' | 'frotaId'>
): void
// valorTotal computed here: Math.round(data.litros * data.precoPorLitro * 100)

registrarDespesa(
  data: Omit<Lancamento, 'id' | 'createdAt' | 'frotaId'>
): void

marcarSincronizado(): void
// Sets pendenteSincronizacao = false; sets ultimaSincronizacao = new Date()

hidratarFromStorage(): void
// Reads 'viagem_ativa' from MMKV and restores Zustand state
```

---

## Sync Queue Operations (`lib/sync/`)

| OperacaoTipo | Payload fields | Supabase target |
|---|---|---|
| `CREATE_VIAGEM` | `{ id, frotaId, caminhaoId, motoristaId, origem, destino, tipoCarga, kmInicial, valorBruto, dataInicio, status: 'em_andamento', createdAt }` | INSERT `fretes` ON CONFLICT DO NOTHING |
| `CREATE_TRECHO` | `{ id, freteId, frotaId, tipo, kmInicial, ordem, createdAt }` | INSERT `trechos_km` |
| `CLOSE_TRECHO` | `{ id, kmFinal, kmRodado, fechadoEm }` | UPDATE `trechos_km` WHERE id |
| `CREATE_ABASTECIMENTO` | `{ id, freteId, frotaId, subtipo, litros, precoPorLitro, valorTotal, local?, kmAtual?, fotoUrl?, createdAt }` | INSERT `abastecimentos` |
| `CREATE_LANCAMENTO` | `{ id, freteId, frotaId, tipo, valor, descricao?, fotoUrl?, createdAt }` | INSERT `lancamentos` |
| `CLOSE_VIAGEM` | `{ freteId, dataFim, status: 'concluido' }` | UPDATE `fretes` WHERE id |

**Idempotency**: Each operation carries a client-generated `id` (cuid). Supabase upserts (`INSERT … ON CONFLICT DO NOTHING` / `UPDATE … WHERE id`) ensure re-sending a queued operation is safe.
