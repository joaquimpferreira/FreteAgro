// e2e/fretes.spec.ts — Playwright E2E tests for User Story 3 (Freight Management)
// Gate 5: includes a 375px mobile snapshot per Quality Gate 5 (playwright.config.ts).
//
// Flows covered:
// 1. /fretes page loads with the list and "Novo frete" button
// 2. Create a freight → redirects to detail page
// 3. Add an expense with deducaoAcerto=true on the freight
// 4. Conclude the freight (status → concluido)
// 5. Soft-delete (freight with expenses → inativado = true)
// 6. Hard-delete via API (freight without links → deleted = true)
// 7. 375px mobile snapshot of /fretes

import { test, expect } from '@playwright/test'

async function loginAsOwner(page: import('@playwright/test').Page) {
  const email    = process.env.TEST_OWNER_EMAIL ?? 'owner@fretagro.test'
  const password = process.env.TEST_OWNER_PASSWORD ?? 'Test@12345'
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
}

test.describe('US3 — Registro de Fretes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  // ─── List page loads ─────────────────────────────────────────────────────────
  test('/fretes page loads', async ({ page }) => {
    await page.goto('/fretes')
    await expect(page.getByRole('heading', { name: 'Fretes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Novo frete' })).toBeVisible()
  })

  // ─── Create freight ──────────────────────────────────────────────────────────
  test('owner can create a freight via API and see it in the list', async ({ request, page }) => {
    // Get a truck to attach to
    const caminhoesRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    expect(caminhoesRes.status()).toBe(200)
    const caminhoesBody = await caminhoesRes.json()

    // If no truck exists, skip (create one first in the fleet test)
    test.skip(caminhoesBody.data.length === 0, 'No active truck available for freight creation')

    const caminhaoId = caminhoesBody.data[0].id

    // Create freight via API
    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId,
        origem:     'Sorriso/MT',
        destino:    'Santos/SP',
        tipoCarga:  'grao',
        kmInicial:  1200,
        valorBruto: 185000000, // R$ 1.850.000,00 in centavos
        dataInicio: new Date().toISOString(),
      },
    })
    expect(freteRes.status()).toBe(201)
    const frete = await freteRes.json()
    expect(frete.id).toBeTruthy()
    expect(frete.status).toBe('em_andamento')
    expect(frete.totalDespesas).toBe(0)

    // Verify it appears in the list
    await page.goto('/fretes')
    await expect(page.getByText('Sorriso/MT')).toBeVisible()
  })

  // ─── Add expense with deducaoAcerto ──────────────────────────────────────────
  test('API: add expense with deducaoAcerto=true to a freight', async ({ request }) => {
    // Create a truck + freight via API
    const caminhaoRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const caminhaoBody = await caminhaoRes.json()
    test.skip(caminhaoBody.data.length === 0, 'No truck available')

    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId: caminhaoBody.data[0].id,
        origem:     'Rondonópolis/MT',
        destino:    'São Paulo/SP',
        tipoCarga:  'farelo',
        kmInicial:  500,
        valorBruto: 5000000,
        dataInicio: new Date().toISOString(),
      },
    })
    const frete = await freteRes.json()

    // Add a deducao expense
    const lancRes = await request.post(`/api/fretes/${frete.id}/lancamentos`, {
      data: {
        tipo:          'combustivel',
        valor:         9500000, // R$ 95.000 in centavos
        descricao:     'Posto BR Km 340',
        deducaoAcerto: true,
      },
    })
    expect(lancRes.status()).toBe(201)
    const lanc = await lancRes.json()
    expect(lanc.deducaoAcerto).toBe(true)
    expect(lanc.valor).toBe(9500000)

    // Verify totalDespesas updated
    const freteUpdated = await request.get(`/api/fretes/${frete.id}`)
    const freteBody = await freteUpdated.json()
    expect(freteBody.totalDespesas).toBe(9500000)
  })

  // ─── Conclude freight ────────────────────────────────────────────────────────
  test('API: conclude a freight (em_andamento → concluido) with kmFinal >= kmInicial', async ({ request }) => {
    const caminhaoRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const caminhaoBody = await caminhaoRes.json()
    test.skip(caminhaoBody.data.length === 0, 'No truck available')

    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId: caminhaoBody.data[0].id,
        origem:     'Cuiabá/MT',
        destino:    'Paranaguá/PR',
        tipoCarga:  'grao',
        kmInicial:  800,
        valorBruto: 3000000,
        dataInicio: new Date().toISOString(),
      },
    })
    const frete = await freteRes.json()

    // Conclude
    const concludeRes = await request.patch(`/api/fretes/${frete.id}`, {
      data: { status: 'concluido', kmFinal: 2100, dataFim: new Date().toISOString() },
    })
    expect(concludeRes.status()).toBe(200)
    const concluded = await concludeRes.json()
    expect(concluded.status).toBe('concluido')
    expect(concluded.kmFinal).toBe(2100)
  })

  // ─── kmFinal < kmInicial rejected ────────────────────────────────────────────
  test('API: kmFinal < kmInicial is rejected with 422', async ({ request }) => {
    const caminhaoRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const caminhaoBody = await caminhaoRes.json()
    test.skip(caminhaoBody.data.length === 0, 'No truck available')

    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId: caminhaoBody.data[0].id,
        origem:     'Alta Floresta/MT',
        destino:    'Belém/PA',
        tipoCarga:  'outro',
        kmInicial:  5000,
        valorBruto: 2000000,
        dataInicio: new Date().toISOString(),
      },
    })
    const frete = await freteRes.json()

    const badPatch = await request.patch(`/api/fretes/${frete.id}`, {
      data: { status: 'concluido', kmFinal: 100, dataFim: new Date().toISOString() },
    })
    expect(badPatch.status()).toBe(422)
  })

  // ─── Soft-delete ─────────────────────────────────────────────────────────────
  test('API: freight with expenses is soft-inactivated on DELETE', async ({ request }) => {
    const caminhaoRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const caminhaoBody = await caminhaoRes.json()
    test.skip(caminhaoBody.data.length === 0, 'No truck available')

    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId: caminhaoBody.data[0].id,
        origem:     'Sinop/MT',
        destino:    'Itajaí/SC',
        tipoCarga:  'grao',
        kmInicial:  1000,
        valorBruto: 1500000,
        dataInicio: new Date().toISOString(),
      },
    })
    const frete = await freteRes.json()

    // Add an expense first
    await request.post(`/api/fretes/${frete.id}/lancamentos`, {
      data: { tipo: 'pedagio', valor: 5000, deducaoAcerto: false },
    })

    // Delete → should soft-inactivate
    const deleteRes = await request.delete(`/api/fretes/${frete.id}`)
    expect(deleteRes.status()).toBe(200)
    const deleteBody = await deleteRes.json()
    expect(deleteBody.inativado).toBe(true)
    expect(deleteBody.deleted).toBeFalsy()
  })

  // ─── Hard-delete (no links) ──────────────────────────────────────────────────
  test('API: freight without expenses is hard-deleted', async ({ request }) => {
    const caminhaoRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const caminhaoBody = await caminhaoRes.json()
    test.skip(caminhaoBody.data.length === 0, 'No truck available')

    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId: caminhaoBody.data[0].id,
        origem:     'Nova Mutum/MT',
        destino:    'Campinas/SP',
        tipoCarga:  'fertilizante',
        kmInicial:  2000,
        valorBruto: 900000,
        dataInicio: new Date().toISOString(),
      },
    })
    const frete = await freteRes.json()

    const deleteRes = await request.delete(`/api/fretes/${frete.id}`)
    expect(deleteRes.status()).toBe(200)
    const deleteBody = await deleteRes.json()
    expect(deleteBody.deleted).toBe(true)
    expect(deleteBody.inativado).toBeFalsy()

    // Verify 404 now
    const getRes = await request.get(`/api/fretes/${frete.id}`)
    expect(getRes.status()).toBe(404)
  })

  // ─── 375px mobile snapshot ──────────────────────────────────────────────────
  test('375px mobile — /fretes renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/fretes')
    await expect(page.getByRole('heading', { name: 'Fretes' })).toBeVisible()
    await expect(page).toHaveScreenshot('fretes-mobile-375.png', { maxDiffPixels: 200 })
  })

  test('375px mobile — /fretes/novo renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/fretes/novo')
    // Form heading should be visible at mobile width
    await expect(page.getByRole('heading', { name: /Novo frete|Frete/ })).toBeVisible()
    await expect(page).toHaveScreenshot('fretes-novo-mobile-375.png', { maxDiffPixels: 200 })
  })

  test('375px mobile — /fretes/[id] detail renders correctly', async ({ request, page }) => {
    // Create a freight to use for the detail view
    const caminhaoRes = await request.get('/api/caminhoes?status=ativo&pageSize=1')
    const caminhaoBody = await caminhaoRes.json()
    test.skip(
      !caminhaoBody?.data?.length,
      'No active truck available — create one first in frota tests',
    )
    const caminhaoId = caminhaoBody.data[0].id
    const freteRes = await request.post('/api/fretes', {
      data: {
        caminhaoId,
        origem:     'Cuiabá/MT',
        destino:    'Rondonópolis/MT',
        tipoCarga:  'grao',
        kmInicial:  500,
        valorBruto: 50000000,
        dataInicio: new Date().toISOString(),
      },
    })
    expect(freteRes.status()).toBe(201)
    const frete = await freteRes.json()

    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`/fretes/${frete.id}`)
    // Detail heading or freight origin should be visible
    await expect(
      page.getByText(/Cuiabá\/MT|Detalhes do frete|Frete/),
    ).toBeVisible({ timeout: 8_000 })
    await expect(page).toHaveScreenshot('fretes-detail-mobile-375.png', { maxDiffPixels: 200 })
  })
})
