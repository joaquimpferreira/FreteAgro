# Contract: Caminhões (Trucks)

**Maps**: User Story 2 (P2) · FR-009, FR-011, FR-012, FR-013, FR-015 · Routes `app/api/caminhoes/route.ts`, `app/api/caminhoes/[id]/route.ts`

All routes owner-only, scoped to caller's `frotaId`.

## GET /api/caminhoes

List trucks (paginated). Supports `?status=ativo|inativo`, `?semMotorista=true` (alerts — FR-015).

Response `200`:

```json
{ "data": [ { "id": "...", "placa": "ABC1D23", "modelo": "Scania R450", "ano": 2021, "carroceria": "graneleiro", "status": "ativo", "motoristaId": "...", "motorista": { "id": "...", "nome": "Carlos" } } ], "page": 1, "pageSize": 20, "total": 8 }
```

## POST /api/caminhoes

Create a truck. (FR-009)

Request:

```json
{ "placa": "ABC1D23", "modelo": "Scania R450", "ano": 2021, "carroceria": "graneleiro" }
```

Responses:
- `201` → created truck (`status: "ativo"`)
- `409` → `PLACA_TAKEN` (placa unique)
- `422` → validation (placa format, carroceria enum)

## GET /api/caminhoes/[id]

Returns one truck with its `motorista`. `404` if out-of-tenant.

## PATCH /api/caminhoes/[id]

Edit any field of an active truck (FR-012), or bind/unbind a driver.

Request (bind driver): `{ "motoristaId": "..." }`

Responses:
- `200` → updated truck
- `409` → `DRIVER_ALREADY_BOUND` — driver already linked to another truck (FR-011, 1:1 rule enforced at DB `@unique` + lib). Message explains the rule.
- `422` → validation

## DELETE /api/caminhoes/[id]

Inactivates the truck (`status: "inativo"`), preserving history. Never hard-deletes when freights exist. (FR-013)

Response `200` → `{ "id": "...", "status": "inativo" }`.
