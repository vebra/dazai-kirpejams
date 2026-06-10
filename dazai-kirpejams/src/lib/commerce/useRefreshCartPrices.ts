'use client'

import { useEffect } from 'react'
import { useCartStore } from './cart-store'
import { useVerification } from '@/components/auth/VerificationProvider'
import { createBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Atnaujina krepšelio kainas iš serverio, kai atidaromas krepšelis/checkout.
 *
 * Kodėl: krepšelis (zustand persist) išsaugo kainą pridėjimo metu. Užsakymo
 * RPC (create_order_atomic, migr 065) kainas perskaičiuoja iš `products` ir
 * atmeta su `price_mismatch`, jei nesutampa. Jei prekės kaina pasikeitė
 * (prasidėjo/baigėsi akcija), kol prekė gulėjo krepšelyje, teisėtas užsakymas
 * būtų atmestas. Čia, kai patvirtintas profesionalas atidaro krepšelį/checkout,
 * vienu RPC kvietimu atsinaujinam dabartines kainas — tad rodoma suma sutampa
 * su ta, kurią paskaičiuos serveris, ir lieka tik tikri (manipuliacijos)
 * neatitikimai.
 *
 * Tik patvirtintiems (kiti ir taip nemato kainų / negali pirkti).
 */
export function useRefreshCartPrices() {
  const items = useCartStore((s) => s.items)
  const refreshPrices = useCartStore((s) => s.refreshPrices)
  const { isVerified, isLoading } = useVerification()

  const ids = items.map((i) => i.productId)
  const idsKey = [...ids].sort().join(',')

  useEffect(() => {
    if (isLoading || !isVerified || ids.length === 0) return
    let cancelled = false
    const supabase = createBrowserSupabase()
    supabase
      .rpc('get_product_prices', { p_ids: ids })
      .then(({ data, error }) => {
        if (cancelled || error || !Array.isArray(data)) return
        const map: Record<string, number> = {}
        for (const r of data as Array<{
          product_id: string
          price_cents: number
          sale_price_cents: number | null
        }>) {
          const onSale =
            r.sale_price_cents != null &&
            r.sale_price_cents > 0 &&
            r.sale_price_cents < r.price_cents
          map[r.product_id] = onSale ? r.sale_price_cents! : r.price_cents
        }
        refreshPrices(map)
      })
    return () => {
      cancelled = true
    }
    // idsKey stabili priklausomybė; refreshPrices stabili (zustand)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified, isLoading, idsKey])
}
