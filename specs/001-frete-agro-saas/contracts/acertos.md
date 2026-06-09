# Contract: Acertos (Settlements)

**Maps**: User Story 4 (P4) · FR-021..FR-028 · Routes `app/api/acertos/route.ts`, `app/api/acertos/[id]/route.ts`

Owner-only, scoped to caller's `frotaId`. **All money in centavos. Settlement math lives in `lib/finance/calcularAcerto.ts` — never rounded except the single commission rounding.** (Principle IV, SC-002)

## POST /api/acertos — Open settlement for a concluded freight

Computes the settlement from the freight and its deduction expenses. (FR-021, FR-023)

Request: `{ "freteId": "..." }`

Server computes (snapshotting the driver's percentual):

```text
valorComissao  = Math.round(valorFrete × percentualComissao / 100)
totalDeducoes  = Σ Lancamento.valor where freteId = X AND deducaoAcerto = true
saldoFinal     = valorComissao − totalDeducoes   // NEVER rounded
```

Responses:
- `201` → settlement (`status: "pendente"`):

```json
{
  "id": "...", "freteId": "...", "motoristaId": "...",
  "valorFrete": 1850000, "percentualComissao": 12,
  "valorComissao": 222000, "totalDeducoes": 45000, "saldoFinal": 177000,
  "status": "pendente",
  "deducoes": [ { "id": "...", "tipo": "vale", "descricao": "Vale posto", "valor": 45000 } ]
}
```

- `409` → freight not `concluido`, or `acerto` already exists (`freteId @unique`)

## GET /api/acertos

List settlements (paginated). Filters `?motoristaId=`, `?status=pendente|realizado`. Used by the per-driver history view (FR-026) and the dashboard "acerto pendente" alert (FR-028).

## GET /api/acertos/[id]

Returns the settlement detail with itemized deductions and computed totals (FR-023). `404` if out-of-tenant.

## PATCH /api/acertos/[id] — Confirm payment

Confirms the settlement. (FR-024)

Request: `{ "status": "realizado" }`

Behavior:
- Sets `status: "realizado"`, `realizadoEm` = now.
- Sets parent `Frete.status: "acerto_realizado"`.

Responses:
- `200` → confirmed settlement
- `409` → already `realizado` (concurrency guard — second-device confirm rejected, Edge Case)

## POST /api/acertos/[id]/comprovante — Generate PDF receipt

Generates the settlement receipt PDF via `lib/pdf/gerarComprovante.ts`, stores it in Supabase Storage, returns the URL. (FR-025, SC-006 < 10s)

Response `200`:

```json
{ "comprovanteUrl": "https://.../acerto-123.pdf" }
```

PDF contains: driver name/data, freight data, itemized commission, deductions list with values, and final `saldoFinal`.

## Driver view (mobile)

`GET /api/acertos?motoristaId=me` — the authenticated driver sees their own current balance and confirmed-settlement history ("Meus ganhos"). (FR-027) Drivers cannot create or confirm settlements.
