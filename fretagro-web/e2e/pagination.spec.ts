// e2e/pagination.spec.ts — Server-side pagination assertions for all list endpoints
// Principle V: lists > 50 rows MUST use server-side pagination; pageSize capped at 50.
// T096: Audits that every list endpoint returns the standard pagination envelope
//       and respects the ≤50 cap enforced by lib/api/pagination.ts.

import { test, expect } from '@playwright/test'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsOwner(page: import('@playwright/test').Page) {
  const email    = process.env.TEST_OWNER_EMAIL    ?? 'owner@fretagro.test'
  const password = process.env.TEST_OWNER_PASSWORD ?? 'Test@12345'
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
}

/** Assert the standard paginated response envelope. */
function assertPaginationEnvelope(body: Record<string, unknown>) {
  expect(body).toHaveProperty('data')
  expect(Array.isArray(body.data)).toBe(true)
  expect(body).toHaveProperty('pagination')

  const pg = body.pagination as Record<string, unknown>
  expect(typeof pg.page).toBe('number')
  expect(typeof pg.pageSize).toBe('number')
  expect(typeof pg.total).toBe('number')
  expect(typeof pg.totalPages).toBe('number')
  expect(typeof pg.hasNext).toBe('boolean')
  expect(typeof pg.hasPrev).toBe('boolean')

  // Principle V: pageSize must never exceed 50
  expect(pg.pageSize).toBeLessThanOrEqual(50)
  // data.length must not exceed pageSize
  expect((body.data as unknown[]).length).toBeLessThanOrEqual(pg.pageSize as number)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Principle V — Server-side pagination (≤50 rows)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  // ── /api/caminhoes ─────────────────────────────────────────────────────────

  test('GET /api/caminhoes returns pagination envelope', async ({ request }) => {
    const res = await request.get('/api/caminhoes')
    expect(res.status()).toBe(200)
    assertPaginationEnvelope(await res.json())
  })

  test('GET /api/caminhoes enforces pageSize=50 cap', async ({ request }) => {
    const res = await request.get('/api/caminhoes?pageSize=999')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pagination.pageSize).toBe(50)
  })

  test('GET /api/caminhoes paginates to page 2', async ({ request }) => {
    const res = await request.get('/api/caminhoes?page=2&pageSize=10')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pagination.page).toBe(2)
    expect(body.pagination.pageSize).toBe(10)
    expect(body.pagination.hasPrev).toBe(true)
  })

  // ── /api/motoristas ────────────────────────────────────────────────────────

  test('GET /api/motoristas returns pagination envelope', async ({ request }) => {
    const res = await request.get('/api/motoristas')
    expect(res.status()).toBe(200)
    assertPaginationEnvelope(await res.json())
  })

  test('GET /api/motoristas enforces pageSize=50 cap', async ({ request }) => {
    const res = await request.get('/api/motoristas?pageSize=999')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pagination.pageSize).toBe(50)
  })

  // ── /api/fretes ────────────────────────────────────────────────────────────

  test('GET /api/fretes returns pagination envelope', async ({ request }) => {
    const res = await request.get('/api/fretes')
    expect(res.status()).toBe(200)
    assertPaginationEnvelope(await res.json())
  })

  test('GET /api/fretes enforces pageSize=50 cap', async ({ request }) => {
    const res = await request.get('/api/fretes?pageSize=200')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pagination.pageSize).toBe(50)
  })

  // ── /api/acertos ───────────────────────────────────────────────────────────

  test('GET /api/acertos returns pagination envelope', async ({ request }) => {
    const res = await request.get('/api/acertos')
    expect(res.status()).toBe(200)
    assertPaginationEnvelope(await res.json())
  })

  test('GET /api/acertos enforces pageSize=50 cap', async ({ request }) => {
    const res = await request.get('/api/acertos?pageSize=100')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pagination.pageSize).toBe(50)
  })

  // ── /api/fretes/[id]/lancamentos ───────────────────────────────────────────

  test('GET /api/fretes/[id]/lancamentos returns pagination envelope', async ({
    request,
  }) => {
    // Fetch any freight to get a valid ID
    const fretesRes = await request.get('/api/fretes?pageSize=1')
    const fretesBody = await fretesRes.json()
    test.skip(
      !fretesBody?.data?.length,
      'No freight available — create one first in fretes tests',
    )
    const freteId = fretesBody.data[0].id

    const res = await request.get(`/api/fretes/${freteId}/lancamentos`)
    expect(res.status()).toBe(200)
    assertPaginationEnvelope(await res.json())
  })

  test('GET /api/fretes/[id]/lancamentos enforces pageSize=50 cap', async ({
    request,
  }) => {
    const fretesRes = await request.get('/api/fretes?pageSize=1')
    const fretesBody = await fretesRes.json()
    test.skip(!fretesBody?.data?.length, 'No freight available')
    const freteId = fretesBody.data[0].id

    const res = await request.get(`/api/fretes/${freteId}/lancamentos?pageSize=999`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pagination.pageSize).toBe(50)
  })

  // ── Default pageSize (20) ──────────────────────────────────────────────────

  test('default pageSize is 20 for /api/caminhoes', async ({ request }) => {
    const res = await request.get('/api/caminhoes')
    const body = await res.json()
    // Default page size is 20 (lib/api/pagination.ts DEFAULT_PAGE_SIZE)
    expect(body.pagination.pageSize).toBe(20)
  })

  test('default pageSize is 20 for /api/fretes', async ({ request }) => {
    const res = await request.get('/api/fretes')
    const body = await res.json()
    expect(body.pagination.pageSize).toBe(20)
  })
})
