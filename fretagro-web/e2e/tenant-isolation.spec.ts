// e2e/tenant-isolation.spec.ts — Multi-tenant isolation E2E (SC-008, quickstart V7)
// Verifies that no cross-fleet resource access is possible via the API.
//
// Security controls:
//   1. API layer: frotaId-scoping guard in lib/api/tenant.ts (lib-level gate)
//   2. DB layer: Supabase RLS policies in prisma/rls-policies.sql
//
// Flows covered:
// 1. Owner A registers a fleet and creates a truck + freight
// 2. Owner B registers a different fleet
// 3. As Owner B, attempt to read Owner A's truck → 404
// 4. As Owner B, attempt to read Owner A's freight → 404
// 5. As Owner B, attempt to read Owner A's motorista → 404
// 6. Unauthenticated access to any fleet resource → 401 / redirect

import { test, expect } from '@playwright/test'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timestamp = Date.now()
const ownerA = {
  email:    `tenant-a-${timestamp}@fretagro.test`,
  password: 'Test@12345',
  frota:    `Frota Alpha ${timestamp}`,
}
const ownerB = {
  email:    `tenant-b-${timestamp}@fretagro.test`,
  password: 'Test@12345',
  frota:    `Frota Beta ${timestamp}`,
}

/** Register a new fleet owner via the registration API and return the response body. */
async function registerOwner(
  request: import('@playwright/test').APIRequestContext,
  owner: typeof ownerA,
) {
  const res = await request.post('/api/auth/cadastro', {
    data: {
      nome:     `Dono ${owner.frota}`,
      email:    owner.email,
      whatsapp: '65999990001',
      senha:    owner.password,
      confirmarSenha: owner.password,
      nomeFrota: owner.frota,
      estado:   'MT',
    },
  })
  return res
}

/** Log in and return an APIRequestContext authenticated as the given user. */
async function loginApi(
  page: import('@playwright/test').Page,
  owner: typeof ownerA,
) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(owner.email)
  await page.getByLabel('Senha').fill(owner.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Wait until redirect away from /login confirming auth succeeded
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('V7 — Multi-tenant isolation (SC-008)', () => {
  // IDs of resources created by Owner A — shared across tests in this describe block
  let caminhaoAId   = ''
  let freteAId      = ''
  let motoristaAId  = ''

  // ── Setup: create Owner A's fleet and resources ───────────────────────────

  test('setup: register Owner A, create truck + driver + freight', async ({ request, page }) => {
    // Register owner A
    const regA = await registerOwner(request, ownerA)
    // 201 = created, 409 = already exists from a prior run (email collision)
    expect([201, 409]).toContain(regA.status())

    // Log in as Owner A
    await loginApi(page, ownerA)

    // Create a truck
    const caminhaoRes = await request.post('/api/caminhoes', {
      data: {
        placa:  `TSA${String(timestamp).slice(-4)}`,
        modelo: 'Volvo FH',
        ano:    2022,
      },
    })
    expect(caminhaoRes.status()).toBe(201)
    const caminhao = await caminhaoRes.json()
    caminhaoAId = caminhao.id

    // Create a driver
    const motoristaRes = await request.post('/api/motoristas', {
      data: {
        nome:     `Motorista Alpha ${timestamp}`,
        whatsapp: '65999990002',
        cnh:      `ABC${String(timestamp).slice(-8)}`,
        percentualComissao: 10,
      },
    })
    expect(motoristaRes.status()).toBe(201)
    const motorista = await motoristaRes.json()
    motoristaAId = motorista.id

    // Create a freight
    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId:  caminhaoAId,
        origem:      'Sorriso/MT',
        destino:     'Santos/SP',
        tipoCarga:   'grao',
        kmInicial:   1200,
        valorBruto:  185000000,
        dataInicio:  new Date().toISOString(),
      },
    })
    expect(freteRes.status()).toBe(201)
    const frete = await freteRes.json()
    freteAId = frete.id

    // Persist resource IDs so subsequent tests can use them
    // (Playwright serialises context state within the same test file run)
    process.env.TENANT_TEST_CAMINHAO_A_ID  = caminhaoAId
    process.env.TENANT_TEST_FRETE_A_ID     = freteAId
    process.env.TENANT_TEST_MOTORISTA_A_ID = motoristaAId
  })

  // ── Setup: register Owner B ───────────────────────────────────────────────

  test('setup: register Owner B', async ({ request }) => {
    const regB = await registerOwner(request, ownerB)
    expect([201, 409]).toContain(regB.status())
  })

  // ── Cross-fleet isolation assertions ─────────────────────────────────────

  test('Owner B cannot read Owner A truck → 404', async ({ request, page }) => {
    await loginApi(page, ownerB)

    const id = process.env.TENANT_TEST_CAMINHAO_A_ID ?? caminhaoAId
    test.skip(!id, 'No truck ID available — run setup test first')

    const res = await request.get(`/api/caminhoes/${id}`)
    expect(res.status()).toBe(404)
  })

  test('Owner B cannot read Owner A freight → 404', async ({ request, page }) => {
    await loginApi(page, ownerB)

    const id = process.env.TENANT_TEST_FRETE_A_ID ?? freteAId
    test.skip(!id, 'No freight ID available — run setup test first')

    const res = await request.get(`/api/fretes/${id}`)
    expect(res.status()).toBe(404)
  })

  test('Owner B cannot read Owner A motorista → 404', async ({ request, page }) => {
    await loginApi(page, ownerB)

    const id = process.env.TENANT_TEST_MOTORISTA_A_ID ?? motoristaAId
    test.skip(!id, 'No motorista ID available — run setup test first')

    const res = await request.get(`/api/motoristas/${id}`)
    expect(res.status()).toBe(404)
  })

  test('Owner B cannot update Owner A truck → 404', async ({ request, page }) => {
    await loginApi(page, ownerB)

    const id = process.env.TENANT_TEST_CAMINHAO_A_ID ?? caminhaoAId
    test.skip(!id, 'No truck ID available — run setup test first')

    const res = await request.patch(`/api/caminhoes/${id}`, {
      data: { modelo: 'Hacked Model' },
    })
    expect(res.status()).toBe(404)
  })

  test('Owner B cannot delete Owner A freight → 404', async ({ request, page }) => {
    await loginApi(page, ownerB)

    const id = process.env.TENANT_TEST_FRETE_A_ID ?? freteAId
    test.skip(!id, 'No freight ID available — run setup test first')

    const res = await request.delete(`/api/fretes/${id}`)
    expect(res.status()).toBe(404)
  })

  // ── Unauthenticated access control ────────────────────────────────────────

  test('unauthenticated request to /api/caminhoes → 401', async ({ request }) => {
    // request context here has no session cookies
    const res = await request.get('/api/caminhoes')
    expect(res.status()).toBe(401)
  })

  test('unauthenticated request to /api/fretes → 401', async ({ request }) => {
    const res = await request.get('/api/fretes')
    expect(res.status()).toBe(401)
  })

  test('unauthenticated browser navigation to /frota → redirects to /login', async ({ page }) => {
    // Use a fresh context with no cookies
    await page.context().clearCookies()
    await page.goto('/frota')
    await expect(page).toHaveURL(/\/login/)
  })
})
