import type { Product } from '@/lib/types'

/**
 * Gryna funkcija (be server-only priklausomybių, kad būtų unit-testuojama):
 * pašalina visus kainų laukus iš produkto. Naudojama duomenų sluoksnyje,
 * kai užklausą daro nepatvirtintas/anoniminis vartotojas — kainos matomos
 * TIK admin'o patvirtintiems profesionalams ir neturi patekti į payload'ą.
 */
export function stripProductPricing(p: Product): Product {
  return {
    ...p,
    price_cents: 0,
    compare_price_cents: null,
    b2b_price_cents: null,
  }
}
