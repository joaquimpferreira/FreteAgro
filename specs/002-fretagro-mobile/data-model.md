# Data Model: FreteAgro Mobile — App do Motorista

**Branch**: `002-fretagro-mobile` | **Date**: 2026-06-22
**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

---

## Overview

This document describes:
1. Two **new Prisma models** to be added to `fretagro-web/prisma/schema.prisma`.
2. Three **new shared TypeScript interfaces** for `packages/shared/types/viagem.ts`.
3. The **client-side state shape** held in Zustand + MMKV.
4. All **entity relationships** and **validation rules** enforced at the `lib/` layer.

---

## 1. New Database Models (Prisma)

### 1.1 TrechoKm

Represents a single leg of a trip: either empty (`vazio`) or loaded (`carregado`).

```prisma
model TrechoKm {
  id          String    @id @default(cuid())
  tipo        String    // 'vazio' | 'carregado'
  kmInicial   Int
  kmFinal     Int?      // null while leg is open
  kmRodado    Int?      // computed: kmFinal - kmInicial (set on closure)
  ordem       Int       // 1, 2, 3 … sequential within the trip
  fechadoEm   DateTime? // null while leg is open; immutable once set

  freteId  String
  frete    Frete   @relation(fields: [freteId], references: [id])

  frotaId  String
  frota    Frota   @relation(fields: [frotaId], references: [id])

  createdAt DateTime @default(now())

  @@map("trechos_km")
}
```

**Validation rules** (enforced in `lib/viagem/calcularTrecho.ts` before persistence):
- `kmFinal` MUST be > `kmInicial` (error: "km final deve ser maior que km inicial").
- A leg where `fechadoEm != null` MUST NOT be reopened or mutated.
- A new leg MUST NOT be opened while a prior leg for the same `freteId` is still open.
- `kmRodado` is always computed (`kmFinal - kmInicial`); it is never accepted as user input.

**State transitions**:

```
OPEN  (kmFinal = null, fechadoEm = null)
  └─ avancar / encerrar → CLOSED (kmFinal set, fechadoEm set, kmRodado computed)
```

---

### 1.2 Abastecimento

Represents a single fuel refuel event linked to a trip.

```prisma
model Abastecimento {
  id            String   @id @default(cuid())
  subtipo       String   // 'diesel' | 'arla'
  litros        Decimal
  precoPorLitro Decimal
  valorTotal    Int      // centavos — computed: round(litros × precoPorLitro × 100)
  local         String?  // posto name (optional — driver may not know at registration time)
  kmAtual       Int?     // km at refuel point (optional)
  fotoUrl       String?  // private Supabase Storage path (NOT a signed URL — see lib/camera/capturarNota.ts)
  trechoId      String?  // optional FK to trechos_km — enables mediaDiesel = kmRodado / litros for diesel legs (FR-013); populated automatically from the current open leg at registration

  freteId String
  frete   Frete  @relation(fields: [freteId], references: [id])

  frotaId String
  frota   Frota  @relation(fields: [frotaId], references: [id])

  createdAt DateTime @default(now())

  @@map("abastecimentos")
}
```

**Validation rules** (enforced in `lib/viagem/` before persistence):
- `litros` MUST be > 0.
- `precoPorLitro` MUST be > 0.
- `valorTotal` = `Math.round(litros × precoPorLitro × 100)` — always computed, never accepted from user input (constitution M-IV).
- `subtipo` MUST be `'diesel'` or `'arla'`.

---

### 1.3 Changes to Existing Models

#### Frete

Add two back-relations (no breaking change to existing columns):

```prisma
// inside model Frete { … }
trechos       TrechoKm[]
abastecimentos Abastecimento[]
```

#### Frota

Add two back-relations:

```prisma
// inside model Frota { … }
trechos        TrechoKm[]
abastecimentos Abastecimento[]
```

---

## 2. Shared TypeScript Interfaces (`packages/shared/types/viagem.ts`)

```typescript
// packages/shared/types/viagem.ts

export interface TrechoKm {
  id: string
  tipo: 'vazio' | 'carregado'
  kmInicial: number
  kmFinal?: number      // undefined while open
  kmRodado?: number     // undefined while open; computed on closure
  ordem: number
  freteId: string
  frotaId: string
  fechadoEm?: Date      // undefined while open
  createdAt: Date
}

export interface Abastecimento {
  id: string
  subtipo: 'diesel' | 'arla'
  litros: number
  precoPorLitro: number
  valorTotal: number    // centavos; always computed
  local?: string        // posto name; optional
  kmAtual?: number      // km at refuel point; optional
  fotoUrl?: string      // Supabase Storage path (not a signed URL)
  trechoId?: string     // optional FK to TrechoKm; populated from current open leg at registration; enables mediaDiesel per FR-013
  freteId: string
  frotaId: string
  createdAt: Date
}

export interface ViagemAtiva {
  freteId: string
  trechos: TrechoKm[]
  trechoAtualIndex: number     // index into trechos[] of the open leg
  despesas: Lancamento[]       // re-uses existing Lancamento type from @fretagro/types
  abastecimentos: Abastecimento[]
  ultimaSincronizacao?: Date
  pendenteSincronizacao: boolean
}
```

---

## 3. Client-Side State (Zustand `store/viagemStore.ts`)

Mirrors `ViagemAtiva` with a null initial state (no active trip).

```typescript
interface ViagemStoreState {
  viagem: ViagemAtiva | null
  // Mutations
  iniciarViagem(params: IniciarViagemParams): void
  avancarTrecho(kmFinal: number): void
  abrirNovoTrecho(tipo: 'vazio' | 'carregado', kmInicial: number): void
  encerrarViagem(kmFinal: number): void
  registrarAbastecimento(data: Omit<Abastecimento, 'id' | 'createdAt' | 'valorTotal'>): void
  registrarDespesa(data: Omit<Lancamento, 'id' | 'createdAt'>): void
  marcarSincronizado(): void
  hidratarFromStorage(): void   // called once at SplashScreen
}
```

**MMKV key**: `'viagem_ativa'` — the entire `ViagemAtiva` object is JSON-serialized on every mutation.

---

## 4. Sync Queue Entry Shape (`lib/storage/queueStorage.ts`)

Each pending operation is stored as a FIFO array under MMKV key `'sync_queue'`:

```typescript
type OperacaoTipo =
  | 'CREATE_VIAGEM'         // new Frete record created by driver
  | 'CREATE_TRECHO'
  | 'CLOSE_TRECHO'
  | 'CREATE_ABASTECIMENTO'
  | 'CREATE_LANCAMENTO'
  | 'CLOSE_VIAGEM'

interface OperacaoPendente {
  id: string          // cuid — idempotency key
  tipo: OperacaoTipo
  payload: Record<string, unknown>
  updatedAt: string   // ISO 8601 — used for last-write-wins conflict resolution
  tentativas: number  // retry count; ≥3 → move to dead-letter queue
}
```

---

## 5. Entity Relationships

```
Frota
 ├── Caminhao ──(1:1)── Motorista
 ├── Frete              ← CREATED by driver via mobile (origem, destino, tipoCarga, kmInicial)
 │    ├── TrechoKm[]        ← NEW (mobile writes, web reads)
 │    ├── Abastecimento[]   ← NEW (mobile writes, web reads)
 │    ├── Lancamento[]      (existing — mobile adds entries)
 │    └── Acerto?           (existing — mobile reads only; created by fleet owner on web)
 └── Lancamento[]           (avulso entries, existing)
```

> **Division of responsibility**: The driver creates and operates Fretes (trips) from the mobile
> app. The fleet owner manages Motoristas, Caminhões, and Acertos exclusively from the web
> dashboard. `valorBruto` is entered by the driver from the **Carta Frete** at departure; if
> not yet available it defaults to `0` and can be updated by the fleet owner on the web.

---

## 6. Derived Calculations (lib/viagem/calcularTrecho.ts)

| Calculation | Formula | When computed |
|---|---|---|
| `kmRodado` | `kmFinal − kmInicial` | On leg closure |
| `mediaDiesel` | `kmRodado / litrosDiesel` | On trip close, only for legs where a diesel Abastecimento has trechoId = trecho.id |
| `kmTotalVazio` | `Σ kmRodado where tipo = 'vazio'` | On trip summary |
| `kmTotalCarregado` | `Σ kmRodado where tipo = 'carregado'` | On trip summary |
| `kmTotalViagem` | `kmTotalVazio + kmTotalCarregado` | On trip summary |
| `valorAbastecimento` | `Math.round(litros × precoPorLitro × 100)` | At input time |
| `totalDespesas` | `Σ Lancamento.valor` | On expense list render |

---

## 7. RLS Policies (additions to `fretagro-web/prisma/rls-policies.sql`)

```sql
-- TrechoKm: tenant isolation
ALTER TABLE trechos_km ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trechos_km_frota_isolation"
  ON trechos_km
  USING (frota_id = current_setting('app.current_frota_id')::text);

-- Abastecimentos: tenant isolation
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abastecimentos_frota_isolation"
  ON abastecimentos
  USING (frota_id = current_setting('app.current_frota_id')::text);
```

Both policies mirror the pattern used for `fretes` and `lancamentos` in the existing `rls-policies.sql`.
