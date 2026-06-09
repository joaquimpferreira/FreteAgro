# API Contracts — FreteAgro Web Platform

**Feature**: 001-frete-agro-saas | **Date**: 2026-06-08

These contracts define the REST surface exposed by Next.js Route Handlers under `app/api/*`. They are consumed by both the web panel and the separate React Native (Expo) driver app.

## Conventions

- **Base path**: `/api`
- **Format**: JSON request/response; `Content-Type: application/json` (except multipart photo uploads).
- **Auth**: All routes except `POST /api/auth/*` and registration require a valid session (Next-Auth). Middleware rejects unauthenticated requests with `401`.
- **Tenancy**: Every request is scoped to the caller's `frotaId` via RLS + `lib/` guards. Cross-fleet access returns `404` (never leak existence).
- **Money**: All monetary values in requests/responses are **integer centavos**.
- **Validation**: Bodies validated with the shared Zod schemas before any DB write; invalid payloads return `422` with field errors.
- **Pagination**: List endpoints accept `?page=&pageSize=` (default `pageSize=20`, max `50`) and return `{ data: [], page, pageSize, total }`.

## Standard error shape

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "human readable", "fields": { "campo": "motivo" } } }
```

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 401 | Unauthenticated |
| 403 | Authenticated but not allowed (e.g. driver hitting owner-only route) |
| 404 | Not found / out-of-tenant |
| 409 | Business-rule conflict (e.g. driver already bound, acerto already realizado) |
| 422 | Validation error |

## Resource index

| Contract | Routes |
|----------|--------|
| [auth.md](./auth.md) | registration, login, password recovery, driver activation |
| [caminhoes.md](./caminhoes.md) | truck CRUD + driver binding |
| [motoristas.md](./motoristas.md) | driver CRUD + invite |
| [fretes.md](./fretes.md) | freight CRUD + status lifecycle + filters |
| [lancamentos.md](./lancamentos.md) | freight expenses |
| [acertos.md](./acertos.md) | settlement calculation, confirmation, receipt |
| [caixa.md](./caixa.md) | cash-flow statement + manual entries |
| [relatorios.md](./relatorios.md) | PDF/Excel report export |

Each contract maps acceptance scenarios (spec.md) and functional requirements (FR-xxx) to concrete endpoints.
