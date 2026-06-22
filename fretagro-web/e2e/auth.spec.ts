// e2e/auth.spec.ts — Playwright E2E tests for User Story 1 (Authentication & Onboarding)
// Gate 5: includes a 375px mobile snapshot per Quality Gate 5 (playwright.config.ts).
//
// Flows covered:
// 1. Owner registration (step 1 → step 2 → redirect to login)
// 2. Owner login → guided welcome / dashboard
// 3. Unauthenticated access → redirect to /login
// 4. 375px mobile snapshot of login page

import { test, expect } from '@playwright/test'

// Unique test user — use a timestamp to avoid collisions across test runs
const testEmail = `e2e-auth-${Date.now()}@fretagro.test`
const testPassword = 'Test@12345'

test.describe('US1 — Authentication & Onboarding', () => {
  // ─── Unauthenticated redirect ───────────────────────────────────────────────
  test('unauthenticated access to / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated access to /frota redirects to /login', async ({ page }) => {
    await page.goto('/frota')
    await expect(page).toHaveURL(/\/login/)
  })

  // ─── Owner registration ─────────────────────────────────────────────────────
  test('owner can complete 2-step registration', async ({ page }) => {
    // Step 1 — personal data
    await page.goto('/cadastro')
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()

    await page.getByLabel('Nome completo').fill('João Teste E2E')
    await page.getByLabel('E-mail').fill(testEmail)
    await page.getByLabel('WhatsApp').fill('65999990000')
    await page.getByLabel('Senha').fill(testPassword)
    await page.getByLabel('Confirmar senha').fill(testPassword)
    await page.getByRole('button', { name: 'Próximo' }).click()

    // Step 2 — fleet data
    await expect(page).toHaveURL(/\/cadastro\/frota/)
    await expect(page.getByRole('heading', { name: 'Dados da frota' })).toBeVisible()

    await page.getByLabel('Nome da frota / empresa').fill('Transportes Teste E2E')
    // Select estado
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'MT' }).click()

    await page.getByRole('button', { name: 'Criar conta' }).click()

    // Should redirect to /login with success message
    await expect(page).toHaveURL(/\/login/)
    await expect(
      page.getByText('Conta criada com sucesso!'),
    ).toBeVisible()
  })

  // ─── Owner login ────────────────────────────────────────────────────────────
  test('owner can log in and see guided welcome or dashboard', async ({ page }) => {
    // NOTE: This test depends on the registered user from the previous test.
    // In CI, tests run in isolation — set TEST_OWNER_EMAIL + TEST_OWNER_PASSWORD env vars
    // to target a pre-seeded user. Here we use the shared test credentials.
    const email = process.env.TEST_OWNER_EMAIL ?? testEmail
    const password = process.env.TEST_OWNER_PASSWORD ?? testPassword

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Should land on dashboard (guided welcome or overview)
    await expect(page).toHaveURL('/')
    // Either guided welcome or dashboard heading must be present
    await expect(
      page.getByRole('heading', { name: /Bem-vindo|Dashboard/ }),
    ).toBeVisible()
  })

  // ─── Login with wrong credentials ───────────────────────────────────────────
  test('login with wrong password shows error message', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('E-mail').fill('nonexistent@fretagro.test')
    await page.getByLabel('Senha').fill('WrongPassword1!')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos')
  })

  // ─── Password recovery ──────────────────────────────────────────────────────
  test('password recovery shows success without revealing if email exists', async ({ page }) => {
    await page.goto('/recuperar-senha')

    await page.getByLabel('E-mail').fill('anotheremail@fretagro.test')
    await page.getByRole('button', { name: 'Enviar instruções' }).click()

    await expect(page.getByRole('status')).toContainText('Se o e-mail estiver cadastrado')
  })

  // ─── 375px mobile snapshot (Quality Gate 5) ─────────────────────────────────
  test('login page renders correctly on 375px viewport', async ({ page }) => {
    // This test runs in the 'mobile-375' Playwright project (see playwright.config.ts)
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

    // Take snapshot for visual regression
    await expect(page).toHaveScreenshot('login-375px.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
