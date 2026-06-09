# Contract: Fretes (Freights)

**Maps**: User Story 3 (P3) + US7 (P7 trip start/end) · FR-016, FR-018, FR-019, FR-020 · Routes `app/api/fretes/route.ts`, `app/api/fretes/[id]/route.ts`

Scoped to caller's `frotaId`. Owners create/manage; drivers (mobile) may start/end their own freights.

## GET /api/fretes

List freights (paginated, server-side per Principle V). Filters (FR-019):

| Query param | Effect |
|-------------|--------|
| `status` | `em_andamento\|concluido\|acerto_pendente\|acerto_realizado` |
| `motoristaId` | by driver (via bound truck) |
| `caminhaoId` | by truck |
| `from` / `to` | date range (ISO) |
| `rota` | origem/destino contains |
| `page` / `pageSize` | pagination (max 50) |

Response `200`:

```json
{ "data": [ { "id": "...", "origem": "Sorriso/MT", "destino": "Santos/SP", "tipoCarga": "grao", "kmInicial": 1200, "kmFinal": 3300, "valorBruto": 1850000, "status": "concluido", "dataInicio": "2026-05-01T08:00:00Z", "dataFim": "2026-05-03T10:00:00Z", "caminhaoId": "...", "totalDespesas": 320000 } ], "page": 1, "pageSize": 20, "total": 42 }
```

## POST /api/fretes

Create a freight. (FR-016) Status defaults to `em_andamento`. Also used by the mobile app to start a trip (FR-037).

Request:

```json
{ "caminhaoId": "...", "origem": "Sorriso/MT", "destino": "Santos/SP", "tipoCarga": "grao", "kmInicial": 1200, "valorBruto": 1850000, "dataInicio": "2026-05-01T08:00:00Z" }
```

Responses:
- `201` → created freight (`status: "em_andamento"`)
- `422` → validation (tipoCarga enum, `valorBruto ≥ 0`)

## GET /api/fretes/[id]

Returns one freight with `lancamentos`, `acerto`, `totalDespesas`, and current `status`. (FR-006 scenario 6) `404` if out-of-tenant.

## PATCH /api/fretes/[id]

Edit fields or advance status. (FR-018) Setting `kmFinal` + `status: "concluido"` requires `kmFinal ≥ kmInicial` (Edge Case).

Request (conclude): `{ "kmFinal": 3300, "dataFim": "2026-05-03T10:00:00Z", "status": "concluido" }`

Responses:
- `200` → updated freight
- `409` → invalid status transition
- `422` → `kmFinal < kmInicial`

State machine: `em_andamento → concluido → acerto_pendente → acerto_realizado`.

## DELETE /api/fretes/[id]

If the freight has linked `lancamentos` or `acerto`, soft-deletes (inactivates) and preserves history. (FR-020, Principle IV) Hard-delete only allowed when no financial links exist.

Responses:
- `200` → `{ "id": "...", "inativado": true }`
- `200` → `{ "id": "...", "deleted": true }` (no links)
