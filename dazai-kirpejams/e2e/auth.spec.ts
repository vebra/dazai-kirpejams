import { test, expect } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_TEST_USER_EMAIL
const E2E_PASSWORD = process.env.E2E_TEST_USER_PASSWORD

test.describe('Auth flow — login + verification + logout', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Skipped: set E2E_TEST_USER_EMAIL + E2E_TEST_USER_PASSWORD in .env.test'
  )

  test('approved user: login → header icon appears → prices show → logout → icon gone', async ({
    page,
  }) => {
    // 1. Pradžia — neprisijungęs, neturi būti žmogeliuko
    await page.goto('/lt')
    await expect(
      page.getByRole('link', { name: /Mano paskyra/i })
    ).toHaveCount(0)

    // 2. Atsidaro login forma
    await page.goto('/lt/prisijungimas')

    await page.getByLabel(/el\. paštas/i).fill(E2E_EMAIL!)
    await page.getByLabel(/slaptažodis/i).fill(E2E_PASSWORD!)
    await page.getByRole('button', { name: /^prisijungti$/i }).click()

    // 3. Po login redirect'as į /paskyra
    await expect(page).toHaveURL(/\/lt\/paskyra/, { timeout: 10_000 })

    // 4. Žmogeliukas headeryje turi atsirasti BE refresh'o (ne "go-to-other-page-and-back" bug)
    await expect(
      page.getByRole('link', { name: /Mano paskyra/i })
    ).toBeVisible({ timeout: 5_000 })

    // 5. Eik į produktus — kainos turi būti matomos (approved user)
    await page.goto('/lt/produktai')
    await page.waitForLoadState('networkidle')

    // Approved user neturi matyti "Prisijungti, kad matytum" CTA
    const loginCta = page.getByText(/prisijungti.*kainai|prisijungti.*kainas/i)
    await expect(loginCta).toHaveCount(0)

    // 6. Logout
    await page.goto('/lt/paskyra')
    await page.getByRole('button', { name: /atsijungti/i }).click()

    // 7. Po logout žmogeliukas dingsta BE refresh'o
    await expect(
      page.getByRole('link', { name: /Mano paskyra/i })
    ).toHaveCount(0, { timeout: 5_000 })
  })

  test('wrong password shows error, no redirect', async ({ page }) => {
    await page.goto('/lt/prisijungimas')

    await page.getByLabel(/el\. paštas/i).fill('nope@example.com')
    await page.getByLabel(/slaptažodis/i).fill('wrongpassword')
    await page.getByRole('button', { name: /^prisijungti$/i }).click()

    await expect(
      page.getByText(/neteisingas|invalid|неверн/i)
    ).toBeVisible({ timeout: 5_000 })

    await expect(page).toHaveURL(/\/lt\/prisijungimas/)
  })
})
