/**
 * Komerciniai konstanta — vienoje vietoje, kad būtų lengva keisti.
 * Visos reikšmės centais (int), kad išvengtume floating-point klaidų.
 */

// Minimali užsakymo suma — 30 EUR
export const MIN_ORDER_CENTS = 3000

// Nemokamas pristatymas — nuo 50 EUR
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000

// Pristatymo kainos
// Paštomatas = tik Omniva — klientas checkout'e renkasi konkretų paštomatą
// iš oficialaus Omniva sąrašo (žr. /api/omniva-lockers + OmnivaLockerPicker).
export const SHIPPING_COURIER_CENTS = 599 // 5.99 EUR
export const SHIPPING_PARCEL_LOCKER_CENTS = 499 // 4.99 EUR (Omniva)
export const SHIPPING_PICKUP_CENTS = 0

// PVM tarifas Lietuvoje (21%) — taikomas TIK jei įmonė yra PVM mokėtoja.
export const VAT_RATE = 0.21

/**
 * Grąžina efektyvų PVM tarifą pagal įmonės PVM mokėtojo kodą.
 * Nėra kodo (ne PVM mokėtojas) → 0, t.y. jokio PVM išskaičiavimo, o
 * dokumentai virsta paprasta „Sąskaita faktūra". Užpildžius kodą (tapus
 * PVM mokėtoju) — automatiškai grįžta 21%, kodo svetainėje keisti nereikia.
 */
export function vatRateFromVatCode(
  vatCode: string | null | undefined
): number {
  return vatCode && vatCode.trim().length > 0 ? VAT_RATE : 0
}

export type DeliveryMethod = 'courier' | 'parcel_locker' | 'pickup'

export const DELIVERY_METHODS: Record<
  DeliveryMethod,
  { priceCents: number; labelKey: string }
> = {
  courier: { priceCents: SHIPPING_COURIER_CENTS, labelKey: 'courier' },
  parcel_locker: {
    priceCents: SHIPPING_PARCEL_LOCKER_CENTS,
    labelKey: 'parcelLocker',
  },
  pickup: { priceCents: SHIPPING_PICKUP_CENTS, labelKey: 'pickup' },
}

export type PaymentMethod = 'bank_transfer' | 'paysera'

/**
 * Apskaičiuoja pristatymo kainą centais.
 * Jei subtotal >= nemokamo pristatymo ribos, grąžina 0.
 */
export function calculateShippingCents(
  subtotalCents: number,
  method: DeliveryMethod
): number {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0
  return DELIVERY_METHODS[method].priceCents
}

/**
 * Apskaičiuoja užsakymo sumas (subtotal, nuolaida, PVM, pristatymas, total).
 *
 * Nuolaida taikoma prekių sumai PRIEŠ pristatymą — klientas mato tiek pigesnes
 * prekes, tiek (jei peržengė ribą) nemokamą pristatymą. Tačiau nemokamo
 * pristatymo riba skaičiuojama nuo NE NUOLAIDOS sumos (subtotal), kad kuponas
 * nepanaikintų kliento teisės į nemokamą pristatymą.
 *
 * PVM skaičiuojamas nuo galutinės sumos (kaina jau su PVM, tad tai yra
 * įskaičiuoto PVM dalis). Jei `vatRate` === 0 (ne PVM mokėtojas),
 * `vatCents` visada 0 — UI ir dokumentai PVM eilutės nerodo.
 */
export function calculateOrderTotals(
  subtotalCents: number,
  deliveryMethod: DeliveryMethod,
  discountCents: number = 0,
  vatRate: number = VAT_RATE
) {
  const shippingCents = calculateShippingCents(subtotalCents, deliveryMethod)
  // Saugumas: nuolaida niekada negali viršyti subtotal
  const clampedDiscount = Math.max(
    0,
    Math.min(discountCents, subtotalCents)
  )
  const totalCents = subtotalCents - clampedDiscount + shippingCents
  // PVM dalis nuo galutinės kainos (kaina ir taip su PVM). Ne PVM
  // mokėtojui (vatRate <= 0) PVM neišskiriamas.
  const vatCents =
    vatRate > 0
      ? Math.round(totalCents - totalCents / (1 + vatRate))
      : 0
  return {
    subtotalCents,
    discountCents: clampedDiscount,
    shippingCents,
    vatCents,
    totalCents,
  }
}

/**
 * Validacija: ar subtotal pasiekia minimalią sumą.
 */
export function meetsMinimumOrder(subtotalCents: number): boolean {
  return subtotalCents >= MIN_ORDER_CENTS
}
