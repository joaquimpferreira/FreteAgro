# Contract: Relatórios & Dashboard

**Maps**: User Story 6 (P6) · FR-033, FR-034, FR-035, FR-036 · Route `app/api/relatorios/route.ts` (+ dashboard aggregates)

Owner-only, scoped to caller's `frotaId`. All money in centavos.

## GET /api/relatorios/dashboard — KPIs + chart data

Returns dashboard aggregates for the selected period. Cached server-side with `revalidate = 300`. (FR-033, FR-034, Principle V, SC-005 < 3s)

Query: `?periodo=este_mes|mes_passado|ultimos_3_meses|este_ano|personalizado&from=&to=`  (FR-035)

Response `200`:

```json
{
  "kpis": { "receitaBruta": 5400000, "totalFretes": 18, "despesasTotais": 2160000, "lucroLiquido": 3240000 },
  "alertas": { "acertosPendentes": 3, "caminhoesSemMotorista": 1 },
  "receitaDespesaPorMes": [ { "mes": "2026-03", "receita": 4800000, "despesa": 2100000 } ],
  "despesasPorCategoria": [ { "categoria": "combustivel", "total": 540000, "percentual": 25.0 } ]
}
```

`alertas` drives the dashboard banners (FR-028 acertos pendentes, FR-015 caminhões sem motorista).

## POST /api/relatorios/export — Export financial report

Generates a financial report for any period. (FR-036, SC-009)

Request:

```json
{ "formato": "pdf" | "excel", "from": "2026-05-01", "to": "2026-05-31" }
```

Behavior:
- `pdf` → `lib/pdf/gerarComprovante.ts` style generator (report layout).
- `excel` → `lib/excel/gerarRelatorio.ts` (xlsx) with receitas, despesas categorizadas, lucro líquido.

Response `200`:

```json
{ "url": "https://.../relatorio-mai-2026.xlsx" }
```

Report contains all data required for accounting review without external lookups (SC-009).
