// e2e/caixa.spec.ts — Playwright E2E for User Story 5 (Caixa da Frota)
// Gate 5: includes a 375px mobile snapshot per Quality Gate 5.
//
// Flows covered:
// 1. /caixa page loads with period selector and KPI cards
// 2. API: GET /api/caixa returns valid statement structure
// 3. Add manual outflow via POST /api/caixa → statement totals update
// 4. Verify lucroLiquido = receitas − totalDespesas (FR-031)
// 5. Category totals + percentuals present in response (FR-032)
// 6. 422 on invalid POST body (tipo missing, valor negative)
// 7. 375px mobile snapshot of /caixa (Gate 5)

import { test, expect } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAsOwner(page: import('@playwright/test').Page) {
  const email    = process.env.TEST_OWNER_EMAIL    ?? 'owner@fretagro.test'
  const password = process.env.TEST_OWNER_PASSWORD ?? 'Test@12345'
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
}

/** Returns YYYY-MM-DD for the first and last day of the current month */
function currentMonthRange(): { from: string; to: string } {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to:   `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('US5 — Caixa da Frota', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  // ─── Page loads ─────────────────────────────────────────────────────────────

  test('/caixa page loads with heading and period selector', async ({ page }) => {
    await page.goto('/caixa')
    await expect(page.getByRole('heading', { name: 'Caixa da Frota' })).toBeVisible()
    // Period selector should be visible
    await expect(page.getByRole('combobox', { name: 'Selecionar período' })).toBeVisible()
  })

  test('/caixa page shows KPI cards after load', async ({ page }) => {
    await page.goto('/caixa')
    // Wait for loading spinner to disappear
    await expect(page.locator('[data-testid="lucro-liquido"]')).toBeVisible({ timeout: 10_000 })
  })

  test('/caixa page has Nova Saída button', async ({ page }) => {
    await page.goto('/caixa')
    await expect(page.getByRole('button', { name: /Nova Saída/i })).toBeVisible()
  })

  // ─── API: GET /api/caixa ─────────────────────────────────────────────────────

  test('API GET /api/caixa returns valid statement structure (FR-029)', async ({ request }) => {
    const { from, to } = currentMonthRange()
    const res = await request.get(`/api/caixa?from=${from}&to=${to}`)

    expect(res.status()).toBe(200)
    const body = await res.json()

    // Shape assertions
    expect(body).toHaveProperty('periodo')
    expect(body.periodo).toMatchObject({ from, to })
    expect(body).toHaveProperty('receitas')
    expect(body.receitas).toHaveProperty('total')
    expect(body.receitas).toHaveProperty('itens')
    expect(Array.isArray(body.receitas.itens)).toBe(true)
    expect(body).toHaveProperty('despesasPorCategoria')
    expect(Array.isArray(body.despesasPorCategoria)).toBe(true)
    expect(body).toHaveProperty('totalDespesas')
    expect(body).toHaveProperty('lucroLiquido')
  })

  test('API: lucroLiquido = receitas.total − totalDespesas (FR-031)', async ({ request }) => {
    const { from, to } = currentMonthRange()
    const res  = await request.get(`/api/caixa?from=${from}&to=${to}`)
    const body = await res.json()

    expect(body.lucroLiquido).toBe(body.receitas.total - body.totalDespesas)
  })

  test('API: despesasPorCategoria items have categoria, total, percentual (FR-032)', async ({ request }) => {
    const { from, to } = currentMonthRange()
    const res  = await request.get(`/api/caixa?from=${from}&to=${to}`)
    const body = await res.json()

    for (const cat of body.despesasPorCategoria) {
      expect(cat).toHaveProperty('categoria')
      expect(typeof cat.total).toBe('number')
      expect(typeof cat.percentual).toBe('number')
      expect(cat.percentual).toBeGreaterThanOrEqual(0)
      expect(cat.percentual).toBeLessThanOrEqual(100.01) // float tolerance
    }
  })

  test('API GET /api/caixa returns 422 when from or to is missing', async ({ request }) => {
    const res = await request.get('/api/caixa?from=2026-05-01')
    expect(res.status()).toBe(422)
  })

  // ─── API: POST /api/caixa — manual outflow ────────────────────────────────

  test('API POST /api/caixa registers avulso outflow and updates totals (FR-030)', async ({ request }) => {
    const { from, to } = currentMonthRange()

    // Record totals before
    const beforeRes  = await request.get(`/api/caixa?from=${from}&to=${to}`)
    const before     = await beforeRes.json()
    const totalBefore = before.totalDespesas as number

    // Add a manual outflow of R$250,00 (25000 centavos)
    const postRes = await request.post('/api/caixa', {
      data: {
        tipo:      'salario',
        descricao: 'Salário motorista — E2E test',
        valor:     25000,
        data:      from, // use start of month to ensure it falls in period
      },
    })
    expect(postRes.status()).toBe(201)
    const created = await postRes.json()
    expect(created.tipo).toBe('salario')
    expect(created.valor).toBe(25000)
    expect(created.frotaId).toBeDefined()

    // Verify totals updated
    const afterRes   = await request.get(`/api/caixa?from=${from}&to=${to}`)
    const after      = await afterRes.json()
    expect(after.totalDespesas).toBe(totalBefore + 25000)
    expect(after.lucroLiquido).toBe(after.receitas.total - after.totalDespesas)
  })

  test('API POST /api/caixa returns 422 for invalid tipo', async ({ request }) => {
    const res = await request.post('/api/caixa', {
      data: {
        tipo:  'invalido_tipo',
        valor: 10000,
        data:  '2026-05-01',
      },
    })
    expect(res.status()).toBe(422)
  })

  test('API POST /api/caixa returns 422 for negative valor', async ({ request }) => {
    const res = await request.post('/api/caixa', {
      data: {
        tipo:  'combustivel',
        valor: -500,
        data:  '2026-05-01',
      },
    })
    expect(res.status()).toBe(422)
  })

  test('API POST /api/caixa returns 422 for missing tipo', async ({ request }) => {
    const res = await request.post('/api/caixa', {
      data: { valor: 10000, data: '2026-05-01' },
    })
    expect(res.status()).toBe(422)
  })

  // ─── UI: manual outflow dialog ────────────────────────────────────────────

  test('UI: opening Nova Saída dialog shows form fields', async ({ page }) => {
    await page.goto('/caixa')
    await page.getByRole('button', { name: /Nova Saída/i }).click()

    // Dialog should open with the form
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Registrar Saída Avulsa')).toBeVisible()
    await expect(page.getByText(/Tipo de Despesa/i)).toBeVisible()
    await expect(page.getByLabel(/Valor/i)).toBeVisible()
    await expect(page.getByLabel(/Data/i)).toBeVisible()
  })

  // ─── Gate 5: 375px mobile snapshot ───────────────────────────────────────

  test('375px mobile snapshot — /caixa', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-375',
      'Snapshot test runs only in mobile-375 project',
    )
    await page.goto('/caixa')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('caixa-mobile-375.png', {
      fullPage:       true,
      maxDiffPixels:  200,
    })
  })
})
