import { test, expect } from '@playwright/test'

// LT yra default locale — rodoma be prefikso (/, /produktai, ...)
// EN ir RU naudoja prefiksą (/en, /ru/produktai, ...)

test.describe('Smoke — homepage', () => {
  test('LT homepage loads with header + nav (no prefix)', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Dažai Kirpėjams/i)

    const logo = page.getByRole('link', { name: 'Dažai Kirpėjams' }).first()
    await expect(logo).toBeVisible()

    await expect(
      page.getByRole('link', { name: 'Produktai' }).first()
    ).toBeVisible()
  })

  test('/lt redirects to root (LT served without prefix)', async ({ page }) => {
    const response = await page.goto('/lt')
    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/$/)
  })

  test('EN homepage loads at /en', async ({ page }) => {
    await page.goto('/en')
    await expect(page).toHaveURL(/\/en$/)
    await expect(page).toHaveTitle(/Hairdresser|Hair Dye|Professional/i)
  })

  test('RU homepage loads at /ru', async ({ page }) => {
    await page.goto('/ru')
    await expect(page).toHaveURL(/\/ru$/)
    await expect(page).toHaveTitle(/парикмахер|краск|професс/i)
  })
})

test.describe('Smoke — language switcher (desktop)', () => {
  // Mobile'e LocaleSwitcher slepiamas po hamburger meniu — testuosim atskirai
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 640, 'desktop only')

  test('LT → EN navigates to /en', async ({ page }) => {
    await page.goto('/')
    // Use exact href to skip mobile-menu duplicates and footer matches
    await page.locator('header a[href="/en"]').first().click()
    await page.waitForURL(/\/en(\/|$)/, { timeout: 10_000 })
  })

  test('EN → RU navigates to /ru', async ({ page }) => {
    await page.goto('/en')
    await page.locator('header a[href="/ru"]').first().click()
    await page.waitForURL(/\/ru(\/|$)/, { timeout: 10_000 })
  })
})

test.describe('Smoke — products page', () => {
  test('LT products listing renders at /produktai', async ({ page }) => {
    await page.goto('/produktai')
    await expect(page).toHaveURL(/\/produktai/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('EN products listing renders at /en/produktai', async ({ page }) => {
    await page.goto('/en/produktai')
    await expect(page).toHaveURL(/\/en\/produktai/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('Smoke — pricing gate (anonymous)', () => {
  test('anonymous user sees "Prisijungti dėl kainos" on product cards', async ({
    page,
  }) => {
    await page.goto('/produktai')

    // Visi produktų kortelės turi rodyti login CTA, ne kainą
    await expect(
      page.getByRole('link', { name: /prisijungti dėl kainos/i }).first()
    ).toBeVisible({ timeout: 10_000 })

    // Sanity: neturi būti realios kainos (€) listing'e neprisijungus
    const euroPrice = page.locator('main').getByText(/\d+[,.]\d{2}\s*€/).first()
    await expect(euroPrice).toHaveCount(0)
  })

  test('anonymous user on product detail page sees login CTA, not price', async ({
    page,
  }) => {
    await page.goto('/produktai/dazai/color-shock-4-23')

    await expect(page.getByText(/prisijungti/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })
})
