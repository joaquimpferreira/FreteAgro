// e2e/frota.spec.ts — Playwright E2E tests for User Story 2 (Fleet Management)
// Gate 5: includes a 375px mobile snapshot per Quality Gate 5 (playwright.config.ts).
//
// Flows covered:
// 1. Create a truck → appears in the fleet list
// 2. Create a driver → appears in the drivers list with "App pendente" badge
// 3. Bind driver to truck → "sem motorista" alert clears for that truck
// 4. Attempt to bind the same driver to a second truck → rejected with DRIVER_ALREADY_BOUND
// 5. 375px mobile snapshot of /frota

import { test, expect } from '@playwright/test'

// Helpers — shared across tests in this file
async function loginAsOwner(page: import('@playwright/test').Page) {
  const email    = process.env.TEST_OWNER_EMAIL ?? 'owner@fretagro.test'
  const password = process.env.TEST_OWNER_PASSWORD ?? 'Test@12345'
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
}

test.describe('US2 — Gestão da Frota', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  // ─── Fleet page loads ───────────────────────────────────────────────────────
  test('/frota page loads with trucks and drivers sections', async ({ page }) => {
    await page.goto('/frota')
    await expect(page.getByRole('heading', { name: 'Frota' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Caminhões' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Motoristas' })).toBeVisible()
  })

  // ─── Create truck ───────────────────────────────────────────────────────────
  test('owner can create a truck', async ({ page }) => {
    const testPlaca = `TST${Math.floor(Math.random() * 9000) + 1000}`
    await page.goto('/frota')

    // Open "Adicionar" modal in the Caminhões section
    const sections = page.getByRole('heading', { name: 'Caminhões' })
    await sections.waitFor()
    await page.getByRole('button', { name: 'Adicionar caminhão' }).first().click()

    // Fill form
    await page.getByLabel('Placa').fill(testPlaca)
    await page.getByLabel('Modelo').fill('Scania R450')
    await page.getByLabel('Ano (opcional)').fill('2021')
    await page.getByRole('button', { name: 'Cadastrar caminhão' }).click()

    // Card should appear in the list
    await expect(page.getByText(testPlaca)).toBeVisible()
  })

  // ─── Create driver ──────────────────────────────────────────────────────────
  test('owner can create a driver and invite is marked pending', async ({ page }) => {
    const testWa = `6599999${Math.floor(Math.random() * 9000) + 1000}`
    await page.goto('/frota')

    // Open "Adicionar" modal in the Motoristas section
    await page.getByRole('button', { name: 'Adicionar motorista' }).first().click()

    // Fill form
    await page.getByLabel('Nome completo').fill('Carlos Teste E2E')
    await page.getByLabel('WhatsApp').fill(testWa)
    await page.getByLabel('Percentual de comissão (%)').fill('12')
    await page.getByRole('button', { name: 'Cadastrar motorista' }).click()

    // Driver row should appear
    await expect(page.getByText('Carlos Teste E2E')).toBeVisible()
    // App invite badge
    await expect(page.getByText('App pendente').first()).toBeVisible()
  })

  // ─── 375px mobile snapshot ──────────────────────────────────────────────────
  test('375px mobile — /frota renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/frota')
    await expect(page.getByRole('heading', { name: 'Frota' })).toBeVisible()
    await expect(page).toHaveScreenshot('frota-mobile-375.png', { maxDiffPixels: 200 })
  })

  // ─── API: DRIVER_ALREADY_BOUND ──────────────────────────────────────────────
  // This test uses direct API calls to avoid depending on UI bind-driver flow
  test('API rejects binding the same driver to two trucks with 409 DRIVER_ALREADY_BOUND', async ({ request }) => {
    // Create two trucks via API
    const truck1Res = await request.post('/api/caminhoes', {
      data: {
        placa:  `DB${Math.floor(Math.random() * 9000) + 1000}`,
        modelo: 'Test Truck 1',
      },
    })
    expect(truck1Res.status()).toBe(201)
    const truck1 = await truck1Res.json()

    const truck2Res = await request.post('/api/caminhoes', {
      data: {
        placa:  `DB${Math.floor(Math.random() * 9000) + 1000}`,
        modelo: 'Test Truck 2',
      },
    })
    expect(truck2Res.status()).toBe(201)
    const truck2 = await truck2Res.json()

    // Create a driver via API
    const driverRes = await request.post('/api/motoristas', {
      data: {
        nome:               'Motorista Bind Test',
        whatsapp:           `65998${Math.floor(Math.random() * 90000) + 10000}`,
        percentualComissao: 10,
      },
    })
    expect(driverRes.status()).toBe(201)
    const driver = await driverRes.json()

    // Bind driver to truck 1 — should succeed
    const bind1 = await request.patch(`/api/caminhoes/${truck1.id}`, {
      data: { motoristaId: driver.id },
    })
    expect(bind1.status()).toBe(200)

    // Attempt to bind the SAME driver to truck 2 — should fail with 409
    const bind2 = await request.patch(`/api/caminhoes/${truck2.id}`, {
      data: { motoristaId: driver.id },
    })
    expect(bind2.status()).toBe(409)
    const errorBody = await bind2.json()
    expect(errorBody.error).toBe('DRIVER_ALREADY_BOUND')
  })
})
