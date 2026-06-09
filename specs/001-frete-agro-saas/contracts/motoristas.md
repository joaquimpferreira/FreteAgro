# Contract: Motoristas (Drivers)

**Maps**: User Story 2 (P2) · FR-006, FR-007, FR-010, FR-012, FR-013 · Routes `app/api/motoristas/route.ts`, `app/api/motoristas/[id]/route.ts`

All routes owner-only, scoped to caller's `frotaId`. Drivers are created exclusively by the owner (Principle IV).

## GET /api/motoristas

List drivers (paginated). Supports `?status=ativo|inativo`.

Response `200`:

```json
{ "data": [ { "id": "...", "nome": "Carlos", "cpf": "12345678900", "whatsapp": "+5565...", "percentualComissao": 12, "tipoContrato": "autonomo", "status": "ativo", "appAtivado": false } ], "page": 1, "pageSize": 20, "total": 5 }
```

## POST /api/motoristas

Create a driver and dispatch the WhatsApp activation invite. (FR-010, FR-006)

Request:

```json
{ "nome": "Carlos", "cpf": "12345678900", "whatsapp": "+5565999990000", "percentualComissao": 12, "tipoContrato": "autonomo" }
```

Responses:
- `201` → created driver (`status: "ativo"`, `appAtivado: false`); invite sent
- `422` → validation (`percentualComissao` 0–100 int, whatsapp required, enum checks)

## GET /api/motoristas/[id]

Returns one driver (with bound `caminhao` if any). `404` if out-of-tenant.

## PATCH /api/motoristas/[id]

Edit any field of an active driver. (FR-012)

Responses:
- `200` → updated driver
- `422` → validation

## DELETE /api/motoristas/[id]

Inactivates the driver (`status: "inativo"`), preserving all settlement history. (FR-013)

Response `200` → `{ "id": "...", "status": "inativo" }`.

## POST /api/motoristas/[id]/convite

Re-send the WhatsApp activation invite. (FR-006)

Response `200` → `{ "sent": true }`.
