import { test, expect, type Page } from '@playwright/test'

type FbqCall = { args: unknown[] }

async function setupPixelSpy(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('cookie-consent-v1', 'accepted')
    const calls: unknown[][] = []
    ;(window as unknown as { __fbqCalls: unknown[][] }).__fbqCalls = calls
    const original = (window as unknown as { fbq?: (...a: unknown[]) => void })
      .fbq
    const spy = function (...args: unknown[]) {
      calls.push(args)
      if (typeof original === 'function') original.apply(null, args)
    }
    Object.defineProperty(window, 'fbq', {
      configurable: true,
      get() {
        return spy
      },
      set() {
        // Block Pixel script from overriding our spy
      },
    })
  })
}

async function getCalls(page: Page): Promise<FbqCall[]> {
  const raw = await page.evaluate(() => {
    return (
      (window as unknown as { __fbqCalls?: unknown[][] }).__fbqCalls ?? []
    )
  })
  return raw.map((args) => ({ args }))
}

function eventNames(calls: FbqCall[]): string[] {
  return calls
    .filter(
      (c) =>
        (c.args[0] === 'track' || c.args[0] === 'trackCustom') &&
        typeof c.args[1] === 'string'
    )
    .map((c) => c.args[1] as string)
}

test.describe('Analytics — Meta Pixel events fire', () => {
  test.setTimeout(90_000)
  test('PageView fires on homepage', async ({ page }) => {
    await setupPixelSpy(page)
    await page.goto('/lt')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    const names = eventNames(await getCalls(page))
    expect(names).toContain('PageView')
  })

  test('PageView fires on client-side navigation', async ({ page }) => {
    await setupPixelSpy(page)
    await page.goto('/lt')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    const before = eventNames(await getCalls(page)).filter(
      (n) => n === 'PageView'
    ).length

    await page.locator('header a[href*="/produktai"]').first().click()
    await page.waitForURL(/\/produktai/)
    await page.waitForTimeout(500)

    const after = eventNames(await getCalls(page)).filter(
      (n) => n === 'PageView'
    ).length
    expect(after).toBeGreaterThan(before)
  })

  // Reikalauja seeded Supabase duomenų su produktais ir stabilios produkto
  // URL. Lokaliai be seed'o nepraeis. Manual smoke via Pixel Helper.
  test.fixme('ViewContent fires on product page', async ({ page }) => {
    await setupPixelSpy(page)
    await page.goto('/produktai', { timeout: 60_000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    const firstProduct = page
      .locator('a[href*="/produktai/"][href*="/"]')
      .filter({ hasNotText: /Peržiūrėti|Visi/i })
      .first()
    await firstProduct.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    await page.waitForTimeout(500)

    const names = eventNames(await getCalls(page))
    expect(names).toContain('ViewContent')
  })

  // AddToCartButton rodomas tik `isVerified` profesionalams. Guest'ams
  // (neautentifikuotas test context'as) matosi login CTA vietoj mygtuko.
  test.fixme('AddToCart fires when adding product to cart', async ({ page }) => {
    await setupPixelSpy(page)
    await page.goto('/produktai', { timeout: 60_000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    const firstProduct = page
      .locator('a[href*="/produktai/"][href*="/"]')
      .filter({ hasNotText: /Peržiūrėti|Visi/i })
      .first()
    await firstProduct.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    const addButton = page
      .getByRole('button', { name: /į krepšelį|add to cart|в корзину/i })
      .first()
    await addButton.click()
    await page.waitForTimeout(500)

    const names = eventNames(await getCalls(page))
    expect(names).toContain('AddToCart')
  })

  // Priklausomas nuo AddToCart srauto (professional auth).
  test.fixme('ViewCart fires on cart page', async ({ page }) => {
    await setupPixelSpy(page)
    await page.goto('/produktai', { timeout: 60_000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    const firstProduct = page
      .locator('a[href*="/produktai/"][href*="/"]')
      .filter({ hasNotText: /Peržiūrėti|Visi/i })
      .first()
    await firstProduct.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    await page
      .getByRole('button', { name: /į krepšelį|add to cart|в корзину/i })
      .first()
      .click()
    await page.waitForTimeout(500)

    await page.goto('/krepselis')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    await page.waitForTimeout(500)

    const names = eventNames(await getCalls(page))
    expect(names).toContain('ViewCart')
  })

  test('WhatsAppClick fires on floating button click', async ({
    page,
    context,
  }) => {
    await setupPixelSpy(page)
    await page.goto('/lt')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    // Block actual navigation so test doesn't leave the page
    await context.route('**/wa.me/**', (route) => route.abort())

    const waButton = page.locator('a[href*="wa.me"]').first()
    await waButton.click({ noWaitAfter: true }).catch(() => {})
    await page.waitForTimeout(300)

    const names = eventNames(await getCalls(page))
    expect(names).toContain('WhatsAppClick')
  })

  test('CalculatorUsed fires after input change', async ({ page }) => {
    await setupPixelSpy(page)
    await page.goto('/skaiciuokle')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    const input = page.locator('input#dyeingsPerWeek')
    await input.fill('20')
    await input.blur()
    await page.waitForTimeout(500)

    const names = eventNames(await getCalls(page))
    expect(names).toContain('CalculatorUsed')
  })

  test('EmailClick fires on footer email link', async ({ page, context }) => {
    await setupPixelSpy(page)
    await page.goto('/lt')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    await context.route('mailto:**', (route) => route.abort())

    const emailLink = page.locator('footer a[href^="mailto:"]').first()
    await emailLink.click({ noWaitAfter: true }).catch(() => {})
    await page.waitForTimeout(300)

    const names = eventNames(await getCalls(page))
    expect(names).toContain('EmailClick')
  })
})
