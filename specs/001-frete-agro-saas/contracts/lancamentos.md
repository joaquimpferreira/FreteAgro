# Contract: Lançamentos de Frete (Freight Expenses)

**Maps**: User Story 3 (P3) + US7 (P7 expense capture) · FR-017, FR-022 · Route `app/api/fretes/[id]/lancamentos/route.ts`

Scoped to caller's `frotaId`. Owner (web) and driver (mobile) can create expenses on the freight.

## GET /api/fretes/[id]/lancamentos

List expenses for a freight (paginated). Returns running `totalDespesas`.

Response `200`:

```json
{
  "data": [
    { "id": "...", "tipo": "combustivel", "descricao": "Posto BR Km 340", "valor": 95000, "fotoUrl": "https://.../nf.jpg", "deducaoAcerto": false, "createdAt": "2026-05-02T12:00:00Z" }
  ],
  "totalDespesas": 320000,
  "page": 1, "pageSize": 20, "total": 6
}
```

## POST /api/fretes/[id]/lancamentos

Add an expense linked to the freight, with optional nota fiscal photo. (FR-017)

Request (JSON, photo uploaded separately to Storage, URL passed here):

```json
{ "tipo": "combustivel", "descricao": "Posto BR Km 340", "valor": 95000, "fotoUrl": "https://.../nf.jpg", "deducaoAcerto": false }
```

`tipo` ∈ `combustivel | borracharia | patio | pedagio | oficina | vale | adiantamento | salario | ipva | seguro | outro`.

`deducaoAcerto: true` marks the expense as a settlement deduction for the driver (FR-022) — it will sum into the freight's `Acerto.totalDeducoes`.

Responses:
- `201` → created expense; freight `totalDespesas` updated
- `422` → validation (tipo enum, `valor ≥ 0`, invalid/unsupported photo MIME — Edge Case)

## Photo upload (Supabase Storage)

Photos are uploaded directly to a Supabase Storage bucket (multipart), MIME/type validated at the boundary; the returned URL is stored in `fotoUrl`. Displayed via `next/image` (Principle V).
