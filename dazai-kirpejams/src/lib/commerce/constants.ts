/**
 * Komerciniai konstanta — vienoje vietoje, kad būtų lengva keisti.
 * Visos reikšmės centais (int), kad išvengtume floating-point klaidų.
 *
 * SVARBU: nuo shipping-settings refaktoringo tikrasis kainų šaltinis yra
 * `shop_settings` DB lentelė (admin → Kainos → Parduotuvės nustatymai).
 * Čia likę skaičiai yra TIK fallback'ai tam atvejui, jei DB nepasiekiama
 * arba raktas neegzistuoja — jie turi sutapti su realiomis reikšmėmis.
 * Server'is paima reikšmes per getShopSettings() ir paduoda žemiau esančioms
 * funkcijoms kaip `ShippingSettings`.
 */

// Minimali užsakymo suma — 30 EUR
export const MIN_ORDER_CENTS = 3000

// Nemokamas pristatymas — nuo 50 EUR
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000

// Pristatymo kainos (fallback — žr. komentarą viršuje)
export const SHIPPING_COURIER_CENTS = 1000 // 10.00 EUR
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

/**
 * Pristatymo kainų rinkinys — paduodamas iš serverio (shop_settings DB).
 * Klientiniai komponentai jį gauna per props, server flow'ai — per
 * getShopSettings() (žr. lib/admin/queries.ts).
 */
export type ShippingSettings = {
  courierCents: number
  parcelLockerCents: number
  pickupCents: number
  freeShippingThresholdCents: number
  minOrderCents: number
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  courierCents: SHIPPING_COURIER_CENTS,
  parcelLockerCents: SHIPPING_PARCEL_LOCKER_CENTS,
  pickupCents: SHIPPING_PICKUP_CENTS,
  freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
  minOrderCents: MIN_ORDER_CENTS,
}

/** Pristatymo būdo bazinė kaina (be nemokamo pristatymo ribos). */
export function deliveryPriceCents(
  method: DeliveryMethod,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
): number {
  switch (method) {
    case 'courier':
      return settings.courierCents
    case 'parcel_locker':
      return settings.parcelLockerCents
    case 'pickup':
      return settings.pickupCents
  }
}

/** Žodyno raktai pristatymo būdų etiketėms (kainos — per deliveryPriceCents). */
export const DELIVERY_METHOD_LABEL_KEYS: Record<DeliveryMethod, string> = {
  courier: 'courier',
  parcel_locker: 'parcelLocker',
  pickup: 'pickup',
}

export type PaymentMethod = 'bank_transfer' | 'paysera'

/**
 * Apskaičiuoja pristatymo kainą centais.
 * Jei subtotal >= nemokamo pristatymo ribos, grąžina 0.
 */
export function calculateShippingCents(
  subtotalCents: number,
  method: DeliveryMethod,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
): number {
  if (subtotalCents >= settings.freeShippingThresholdCents) return 0
  return deliveryPriceCents(method, settings)
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
  vatRate: number = VAT_RATE,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
) {
  const shippingCents = calculateShippingCents(
    subtotalCents,
    deliveryMethod,
    settings
  )
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
export function meetsMinimumOrder(
  subtotalCents: number,
  minOrderCents: number = MIN_ORDER_CENTS
): boolean {
  return subtotalCents >= minOrderCents
}
