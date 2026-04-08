/**
 * Komerciniai konstanta — vienoje vietoje, kad būtų lengva keisti.
 * Visos reikšmės centais (int), kad išvengtume floating-point klaidų.
 */

// Minimali užsakymo suma — 30 EUR
export const MIN_ORDER_CENTS = 3000

// Nemokamas pristatymas — nuo 50 EUR
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000

// Pristatymo kainos
export const SHIPPING_COURIER_CENTS = 499 // 4.99 EUR
export const SHIPPING_PARCEL_LOCKER_CENTS = 299 // 2.99 EUR
export const SHIPPING_PICKUP_CENTS = 0

// PVM tarifas Lietuvoje (21%)
export const VAT_RATE = 0.21

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
 * Apskaičiuoja užsakymo sumas (subtotal, PVM, pristatymas, total).
 * PVM skaičiuojamas nuo subtotal — kaina jau su PVM, tad tai yra
 * dalis nuo galutinės kainos (included VAT).
 */
export function calculateOrderTotals(
  subtotalCents: number,
  deliveryMethod: DeliveryMethod
) {
  const shippingCents = calculateShippingCents(subtotalCents, deliveryMethod)
  const totalCents = subtotalCents + shippingCents
  // PVM dalis nuo galutinės kainos (kaina ir taip su PVM)
  const vatCents = Math.round(totalCents - totalCents / (1 + VAT_RATE))
  return { subtotalCents, shippingCents, vatCents, totalCents }
}

/**
 * Validacija: ar subtotal pasiekia minimalią sumą.
 */
export function meetsMinimumOrder(subtotalCents: number): boolean {
  return subtotalCents >= MIN_ORDER_CENTS
}
