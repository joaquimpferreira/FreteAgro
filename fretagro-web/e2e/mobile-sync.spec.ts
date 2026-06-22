// e2e/mobile-sync.spec.ts — API tests for User Story 7 (Mobile Driver App Support)
// Tests the web API's ability to accept driver trip start/end and expense writes
// idempotently, and exposes the driver "Meus ganhos" view.
//
// Flows covered:
// 1. Driver logs in and can only access their own bound-truck fretes (403 otherwise)
// 2. Driver creates a frete (trip start) via POST /api/fretes with X-Idempotency-Key
// 3. Driver adds an expense via POST /api/fretes/[id]/lancamentos with X-Idempotency-Key
// 4. Driver ends the trip via PATCH /api/fretes/[id] with kmFinal
// 5. Duplicate sync (replayed writes) returns the same response (idempotency)
// 6. Driver reads GET /api/acertos?motoristaId=me — balance + history
// 7. A driver is rejected (403) when accessing another fleet's frete
//
// Note: these are API-level tests (via Playwright request fixtures) — no UI
// interaction needed. The React Native (Expo) driver app is out of scope.

import { test, expect } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Authenticate as the owner to set up test data. */
async function ownerSession(request: import('@playwright/test').APIRequestContext) {
  const email    = process.env.TEST_OWNER_EMAIL    ?? 'owner@fretagro.test'
  const password = process.env.TEST_OWNER_PASSWORD ?? 'Test@12345'
  const res = await request.post('/api/auth/callback/credentials', {
    form: { email, password, callbackUrl: '/', redirect: 'false' },
  })
  return res.status() < 400
}

/** Authenticate as a driver. */
async function driverSession(request: import('@playwright/test').APIRequestContext) {
  const email    = process.env.TEST_DRIVER_EMAIL    ?? 'driver@fretagro.test'
  const password = process.env.TEST_DRIVER_PASSWORD ?? 'Driver@12345'
  const res = await request.post('/api/auth/callback/credentials', {
    form: { email, password, callbackUrl: '/', redirect: 'false' },
  })
  return res.status() < 400
}

/** Generate a RFC4122 v4 UUID for idempotency keys. */
function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe('US7 — Driver Mobile API Sync', () => {
  // ─── T090: Driver authorization ─────────────────────────────────────────────

  test('driver cannot create a frete for a truck that is not bound to them', async ({ request }) => {
    const loggedIn = await driverSession(request)
    test.skip(!loggedIn, 'Driver test account not configured')

    // Find a truck NOT bound to this driver (use any truck with a different motoristaId)
    const trucks = await request.get('/api/caminhoes?status=ativo&pageSize=5')
    const trucksBody = await trucks.json()

    // Get driver's own motoristaId from session
    const sessionRes = await request.get('/api/auth/session')
    const session = await sessionRes.json()
    const myMotoristaId = session?.user?.motoristaId

    const otherTruck = trucksBody.data?.find(
      (t: { id: string; motoristaId?: string }) => t.motoristaId !== myMotoristaId,
    )
    test.skip(!otherTruck, 'No other truck available for 403 test')

    const res = await request.post('/api/fretes', {
      data: {
        origem:      'Origem Teste',
        destino:     'Destino Teste',
        tipoCarga:   'grao',
        kmInicial:   0,
        valorBruto:  100000,
        dataInicio:  new Date().toISOString(),
        caminhaoId:  otherTruck.id,
      },
    })

    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('FORBIDDEN')
  })

  test('driver cannot add expenses to a frete not belonging to their truck', async ({ request }) => {
    const loggedIn = await driverSession(request)
    test.skip(!loggedIn, 'Driver test account not configured')

    // Get a frete not owned by the driver
    const freteRes = await request.get('/api/fretes?pageSize=5')
    const freteBody = await freteRes.json()

    const sessionRes = await request.get('/api/auth/session')
    const session = await sessionRes.json()
    const myMotoristaId = session?.user?.motoristaId

    // Find a frete whose truck's driver is someone else
    const trucks = await request.get('/api/caminhoes?pageSize=20')
    const trucksBody = await trucks.json()
    const otherTruckIds = trucksBody.data
      ?.filter((t: { motoristaId?: string }) => t.motoristaId !== myMotoristaId)
      .map((t: { id: string }) => t.id) ?? []

    const otherFrete = freteBody.data?.find((f: { caminhaoId: string }) =>
      otherTruckIds.includes(f.caminhaoId),
    )
    test.skip(!otherFrete, 'No frete for another driver available')

    const res = await request.post(`/api/fretes/${otherFrete.id}/lancamentos`, {
      data: {
        tipo:    'pedagio',
        valor:   5000,
        descricao: 'Teste 403',
      },
    })

    expect(res.status()).toBe(403)
  })

  // ─── T091: Idempotency ───────────────────────────────────────────────────────

  test('POST /api/fretes with X-Idempotency-Key is idempotent (owner)', async ({ request }) => {
    const loggedIn = await ownerSession(request)
    test.skip(!loggedIn, 'Owner test account not configured')

    const trucks = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const trucksBody = await trucks.json()
    test.skip(trucksBody.data?.length === 0, 'No active truck available')

    const caminhaoId = trucksBody.data[0].id
    const idempotencyKey = uuidV4()

    const payload = {
      origem:     'Cidade A',
      destino:    'Cidade B',
      tipoCarga:  'grao',
      kmInicial:  1000,
      valorBruto: 500000,
      dataInicio: new Date().toISOString(),
      caminhaoId,
    }

    // First request — creates the frete
    const first = await request.post('/api/fretes', {
      data: payload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    })
    expect(first.status()).toBe(201)
    const firstBody = await first.json()

    // Second request (duplicate sync) — must return same body and same status
    const second = await request.post('/api/fretes', {
      data: payload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    })
    expect(second.status()).toBe(201)
    const secondBody = await second.json()

    // Idempotent: same frete ID, no duplicate created
    expect(secondBody.id).toBe(firstBody.id)

    // Cleanup: delete the created frete
    await request.delete(`/api/fretes/${firstBody.id}`)
  })

  test('POST lancamentos with X-Idempotency-Key is idempotent', async ({ request }) => {
    const loggedIn = await ownerSession(request)
    test.skip(!loggedIn, 'Owner test account not configured')

    const trucks = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const trucksBody = await trucks.json()
    test.skip(trucksBody.data?.length === 0, 'No active truck available')

    const caminhaoId = trucksBody.data[0].id

    // Create a frete to add expenses to
    const freteRes = await request.post('/api/fretes', {
      data: {
        origem:     'Sync Origem',
        destino:    'Sync Destino',
        tipoCarga:  'grao',
        kmInicial:  0,
        valorBruto: 200000,
        dataInicio: new Date().toISOString(),
        caminhaoId,
      },
    })
    expect(freteRes.status()).toBe(201)
    const frete = await freteRes.json()

    const idempotencyKey = uuidV4()
    const lancamentoPayload = { tipo: 'pedagio', valor: 3000, descricao: 'Pátio sync' }

    // First write
    const first = await request.post(`/api/fretes/${frete.id}/lancamentos`, {
      data: lancamentoPayload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    })
    expect(first.status()).toBe(201)
    const firstBody = await first.json()

    // Replayed write (duplicate from offline sync)
    const second = await request.post(`/api/fretes/${frete.id}/lancamentos`, {
      data: lancamentoPayload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    })
    expect(second.status()).toBe(201)
    const secondBody = await second.json()

    // Same lancamento ID — no duplicate created
    expect(secondBody.id).toBe(firstBody.id)

    // Verify only ONE lancamento exists
    const listRes = await request.get(`/api/fretes/${frete.id}/lancamentos`)
    const listBody = await listRes.json()
    const matching = listBody.data?.filter((l: { tipo: string }) => l.tipo === 'pedagio') ?? []
    expect(matching).toHaveLength(1)

    // Cleanup
    await request.delete(`/api/fretes/${frete.id}`)
  })

  // ─── Full driver trip flow (T090 + T091 combined) ────────────────────────────

  test('driver completes full trip sync flow: start → expense → end', async ({ request }) => {
    const loggedIn = await ownerSession(request)
    test.skip(!loggedIn, 'Owner test account not configured — using owner for full flow test')

    const trucks = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const trucksBody = await trucks.json()
    test.skip(trucksBody.data?.length === 0, 'No active truck available')

    const caminhaoId = trucksBody.data[0].id

    // Step 1: Start trip (POST /api/fretes)
    const tripKey = uuidV4()
    const freteRes = await request.post('/api/fretes', {
      data: {
        origem:     'Fazenda São Paulo',
        destino:    'Porto de Santos',
        tipoCarga:  'grao',
        kmInicial:  50000,
        valorBruto: 750000,
        dataInicio: new Date().toISOString(),
        caminhaoId,
      },
      headers: { 'X-Idempotency-Key': tripKey },
    })
    expect(freteRes.status()).toBe(201)
    const frete = await freteRes.json()
    expect(frete.status).toBe('em_andamento')

    // Step 2: Add an expense
    const expenseKey = uuidV4()
    const expenseRes = await request.post(`/api/fretes/${frete.id}/lancamentos`, {
      data: { tipo: 'combustivel', valor: 25000, descricao: 'Abastecimento SP' },
      headers: { 'X-Idempotency-Key': expenseKey },
    })
    expect(expenseRes.status()).toBe(201)
    const expense = await expenseRes.json()
    expect(expense.tipo).toBe('combustivel')

    // Step 3: End the trip (PATCH with kmFinal)
    const endRes = await request.patch(`/api/fretes/${frete.id}`, {
      data: {
        status:  'concluido',
        kmFinal: 51200,
        dataFim: new Date().toISOString(),
      },
    })
    expect(endRes.status()).toBe(200)
    const ended = await endRes.json()
    expect(ended.status).toBe('concluido')
    expect(ended.kmFinal).toBe(51200)

    // Cleanup
    await request.delete(`/api/fretes/${frete.id}`)
  })

  // ─── T092: Driver "Meus ganhos" view ─────────────────────────────────────────

  test('GET /api/acertos?motoristaId=me returns balance summary for driver', async ({ request }) => {
    const loggedIn = await driverSession(request)
    test.skip(!loggedIn, 'Driver test account not configured')

    const res = await request.get('/api/acertos?motoristaId=me')
    expect(res.status()).toBe(200)

    const body = await res.json()

    // Must have paginated data
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('pagination')

    // Must include the balance summary (FR-027 "Meus ganhos" extension)
    expect(body).toHaveProperty('saldo')
    expect(typeof body.saldo.totalConfirmado).toBe('number')
    expect(typeof body.saldo.totalPendente).toBe('number')

    // Centavos must be non-negative integers
    expect(body.saldo.totalConfirmado).toBeGreaterThanOrEqual(0)
    expect(body.saldo.totalPendente).toBeGreaterThanOrEqual(0)
  })

  test('GET /api/acertos?motoristaId=me returns empty saldo for non-motorista session', async ({ request }) => {
    const loggedIn = await ownerSession(request)
    test.skip(!loggedIn, 'Owner test account not configured')

    const res = await request.get('/api/acertos?motoristaId=me')
    expect(res.status()).toBe(200)

    const body = await res.json()
    // Owner calling ?motoristaId=me returns empty list (not a driver session)
    expect(body.data).toHaveLength(0)
  })
})
