import type { Product } from '@/lib/types'

// DB `products` lentelėje yra ir vidinių laukų (pvz. savikaina), kurių NĖRA
// `Product` tipe, bet jie ateina per `select('*')` ir pasiektų klientą RSC
// payload'e. Tipiškai apsaugom prieigą per šį papildytą tipą.
type ProductRow = Product & { cost_price_cents?: number | null }

/**
 * Pašalina VIDINIUS laukus, kurie niekada neturi pasiekti kliento —
 * nepriklausomai nuo to, ar vartotojas patvirtintas. Šiuo metu: savikaina
 * (`cost_price_cents`). Taikoma VISIEMS klientui siunčiamiems produktams.
 */
export function stripInternalFields(p: Product): Product {
  const row = p as ProductRow
  if (row.cost_price_cents == null) return p
  return { ...row, cost_price_cents: null } as Product
}

/**
 * Gryna funkcija (be server-only priklausomybių, kad būtų unit-testuojama):
 * pašalina kainų laukus IR vidinius laukus. Naudojama, kai užklausą daro
 * nepatvirtintas/anoniminis vartotojas — kainos matomos TIK admin'o
 * patvirtintiems profesionalams ir neturi patekti į payload'ą.
 */
export function stripProductPricing(p: Product): Product {
  return {
    ...(p as ProductRow),
    price_cents: 0,
    compare_price_cents: null,
    b2b_price_cents: null,
    cost_price_cents: null,
  } as Product
}
