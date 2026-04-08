import 'server-only'

/**
 * Paysera WebToPay integracijos stub'as. Dabar nėra konfigūruota —
 * kai gausime `PAYSERA_PROJECT_ID` ir `PAYSERA_SIGN_PASSWORD`, tiesiog
 * užpildysime `buildPaymentUrl` ir `verifyCallback` implementacijas.
 *
 * Tuo tarpu visos grąžinamos reikšmės leidžia checkout flow veikti
 * su `bank_transfer` metodu — Paysera pasirinkimas tik rodomas UI,
 * bet kol `isPayseraConfigured` === false, mes visada fallback'inam
 * į banko pavedimo flow'ą.
 *
 * @see https://developers.paysera.com/en/checkout/integrations/integration-specification
 */

export const isPayseraConfigured = Boolean(
  process.env.PAYSERA_PROJECT_ID && process.env.PAYSERA_SIGN_PASSWORD
)

type BuildPaymentUrlArgs = {
  orderNumber: string
  amountCents: number
  currency?: string
  email: string
  locale: 'lt' | 'en' | 'ru'
  successUrl: string
  cancelUrl: string
  callbackUrl: string
}

/**
 * TODO: Pilna implementacija, kai gausime Paysera kredencialus.
 * Reikės:
 *  1. Base64 encode parametrus
 *  2. MD5 sign su sign password
 *  3. Grąžinti `https://bank.paysera.com/pay/?data=...&sign=...`
 */
export function buildPaymentUrl(_args: BuildPaymentUrlArgs): string | null {
  if (!isPayseraConfigured) return null
  throw new Error('Paysera integracija dar neimplementuota.')
}

/**
 * Verify Paysera callback signature.
 * TODO: Implementuoti, kai bus Paysera konfigūracija.
 */
export function verifyCallback(_data: string, _sign: string): boolean {
  if (!isPayseraConfigured) return false
  throw new Error('Paysera callback verifikacija dar neimplementuota.')
}
