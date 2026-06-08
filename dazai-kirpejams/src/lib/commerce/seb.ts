import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * SEB e-prekybos (Baltics e-commerce gateway) integracija.
 *
 * Modelis (toks pat visose Baltijos šalyse):
 *  1. Sukuriam JSON payload'ą su `api_key`, suma, valiuta, `reference`,
 *     `callback_url`, return URL'ais → base64 → laukas `data`.
 *  2. `sign` = HMAC( shop secret, data ) — parašom, kad SEB atpažintų mus.
 *  3. POST {base}/payments/oneoff → atsakyme gaunam `payment_url`.
 *  4. Nukreipiam klientą į `payment_url` (kortelė / banklink / Apple/Google Pay).
 *  5. SEB grąžina callback'ą (POST: `data` + `sign`) → patikrinam parašą,
 *     atnaujinam užsakymo `payment_status` → „paid".
 *
 * STATUSAS: turim sutartį su SEB, bet dar NEGAVOM API raktų (test). Kol
 * `isSebConfigured` === false, adapteris yra inert — order flow toliau
 * naudoja bank_transfer. Įjungsim tik įvedę raktus ir ištestavę preview.
 *
 * ⚠️ PATVIRTINTI prieš prod (pagal Prekybininko portalo API docs):
 *   - tikslūs payload laukų pavadinimai (žemiau pažymėta „CONFIRM")
 *   - HMAC algoritmas (sha512 ar kt.) — žr. `SIGN_ALGO`
 *   - oneoff endpoint kelias ir test/live base URL'ai
 *
 * @see https://support.ecommerce.sebgroup.com/api-documentation/
 */

// CONFIRM: portalo docs — ar sha512, ar sha1/sha256.
const SIGN_ALGO = 'sha512'

export const isSebConfigured = Boolean(
  process.env.SEB_API_KEY && process.env.SEB_SECRET_KEY
)

/**
 * Test ar live aplinka. Numatytai test, kad atsitiktinai neapmokestintume
 * realių kortelių, kol nepatvirtinom srauto. Live įjungsim env reikšme
 * `SEB_ENV=live` tik po preview testų.
 */
function apiBaseUrl(): string {
  // CONFIRM: tikslūs base URL'ai iš portalo docs.
  const live = process.env.SEB_API_BASE_LIVE
  const test = process.env.SEB_API_BASE_TEST
  return process.env.SEB_ENV === 'live'
    ? (live ?? '')
    : (test ?? '')
}

type CreatePaymentArgs = {
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
 * Parašom base64 `data` lauką shop secret raktu.
 */
function sign(data: string): string {
  return createHmac(SIGN_ALGO, process.env.SEB_SECRET_KEY ?? '')
    .update(data)
    .digest('hex')
}

/**
 * Sukuria oneoff mokėjimą ir grąžina `payment_url`, į kurį reikia
 * nukreipti klientą. `null`, jei adapteris nesukonfigūruotas.
 */
export async function createOneoffPayment(
  args: CreatePaymentArgs
): Promise<{ paymentUrl: string; reference: string } | null> {
  if (!isSebConfigured) return null

  // CONFIRM: laukų pavadinimai pagal portalo /payments/oneoff specifikaciją.
  const payload = {
    api_key: process.env.SEB_API_KEY,
    amount: (args.amountCents / 100).toFixed(2),
    currency: args.currency ?? 'EUR',
    reference: args.orderNumber,
    email: args.email,
    locale: args.locale,
    callback_url: args.callbackUrl,
    return_url: args.successUrl,
    cancel_url: args.cancelUrl,
  }

  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
  const signature = sign(data)

  const res = await fetch(`${apiBaseUrl()}/payments/oneoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, sign: signature }),
  })

  if (!res.ok) {
    console.error('[seb] createOneoffPayment failed:', res.status, await res.text())
    return null
  }

  // CONFIRM: atsakymo struktūra — kur tiksliai grąžinamas payment_url.
  const json = (await res.json()) as {
    payment_url?: string
    payment_reference?: string
  }
  if (!json.payment_url) {
    console.error('[seb] createOneoffPayment: no payment_url in response', json)
    return null
  }

  return {
    paymentUrl: json.payment_url,
    reference: json.payment_reference ?? args.orderNumber,
  }
}

/**
 * Patikrina SEB callback'o parašą. SEB siunčia POST su `data` (base64 JSON)
 * ir `sign`. Perskaičiuojam HMAC tuo pačiu shop secret ir lyginam
 * timing-safe būdu.
 */
export function verifyCallback(data: string, providedSign: string): boolean {
  if (!isSebConfigured) return false
  const expected = sign(data)
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(providedSign, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Dekoduoja patikrintą callback'o `data` lauką į objektą.
 * KVIESTI TIK po sėkmingo `verifyCallback`.
 */
export function decodeCallback(data: string): {
  reference?: string
  payment_reference?: string
  status?: string
} {
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
  } catch {
    return {}
  }
}
