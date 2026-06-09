# Contract: Caixa (Cash Flow)

**Maps**: User Story 5 (P5) · FR-029, FR-030, FR-031, FR-032 · Route `app/api/caixa/route.ts`

Owner-only, scoped to caller's `frotaId`. All money in centavos. Aggregation in `lib/finance/calcularCusto.ts`.

## GET /api/caixa — Statement for a period

Returns consolidated entries and totals for a period. (FR-029, FR-031, FR-032)

Query: `?from=2026-05-01&to=2026-05-31`

Response `200`:

```json
{
  "periodo": { "from": "2026-05-01", "to": "2026-05-31" },
  "receitas": { "total": 5400000, "itens": [ { "freteId": "...", "valor": 1850000, "data": "2026-05-03" } ] },
  "despesasPorCategoria": [
    { "categoria": "comissao", "total": 648000, "percentual": 30.0 },
    { "categoria": "combustivel", "total": 540000, "percentual": 25.0 },
    { "categoria": "manutencao", "total": 216000, "percentual": 10.0 }
  ],
  "totalDespesas": 2160000,
  "lucroLiquido": 3240000
}
```

`lucroLiquido = receitas.total − totalDespesas` (FR-031). Each category shows `total` and `percentual` over total expenses (FR-032).

## POST /api/caixa — Manual outflow entry

Registers an avulso cash outflow (a `Lancamento` with no `freteId`). (FR-030)

Request:

```json
{ "tipo": "salario", "descricao": "Salário motorista mai/26", "valor": 250000, "data": "2026-05-05" }
```

`tipo` ∈ `comissao | manutencao | patio | combustivel | salario | ipva | seguro | pedagio | borracharia | oficina | outro`.

Responses:
- `201` → created entry; statement updated
- `422` → validation (tipo enum, `valor ≥ 0`)
