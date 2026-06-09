# Contract: Authentication & Onboarding

**Maps**: User Story 1 (P1) · FR-001..FR-008 · Route `app/api/auth/[...nextauth]/route.ts` + registration handlers

## POST /api/auth/cadastro — Owner registration (step 1 + 2 combined)

Creates the owner `User` and their `Frota`. (FR-001, FR-002)

Request:

```json
{
  "nome": "João Silva",
  "email": "joao@frota.com",
  "whatsapp": "+5565999990000",
  "senha": "********",
  "frotaNome": "Transportes Silva",
  "estado": "MT",
  "cnpjCpf": "12345678000190"
}
```

Responses:
- `201` → `{ "userId": "...", "frotaId": "...", "role": "dono" }`
- `409` → email already registered (`EMAIL_TAKEN`)
- `422` → validation errors (email format, senha length, estado required)

## POST /api/auth/login

Handled by Next-Auth Credentials provider. (FR-003)

Request: `{ "email": "...", "senha": "..." }`

Responses:
- `200` → session established; body `{ "role": "dono" | "motorista", "frotaId": "..." }`
- `401` → invalid credentials

Routing: `dono` → web panel; `motorista` → mobile app (FR-003).

## POST /api/auth/recuperar-senha

Sends a password-reset link by email. (FR-005)

Request: `{ "email": "..." }`
Response: `200` always (no account enumeration).

## POST /api/auth/motorista/ativar — Driver activation

Driver sets their password from the WhatsApp invite link. No self-registration. (FR-006, FR-007, Principle IV)

Request: `{ "token": "<invite-token>", "senha": "********" }`

Responses:
- `200` → `{ "motoristaId": "...", "appAtivado": true }`; pre-filled owner data already present
- `401` → invalid/expired token

## Session / route protection

- All authenticated routes guarded by Next.js middleware delegating to `lib/auth/config.ts`. (FR-004, Principle VI)
- Invalid/expired session on any protected route → redirect to `/login` (web) or `401` (API).
- Session carries `frotaId` + `role` for RLS and authorization.
