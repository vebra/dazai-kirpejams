'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { useVerification } from '@/components/auth/VerificationProvider'

/**
 * Kainų užkrovimas NARŠYKLĖJE patvirtintiems profesionalams.
 *
 * Statiniuose puslapiuose (Fazė 1: prekės detalė) kaina NEpatenka į HTML —
 * serveris renderina kaip svečiui (kaina nukirpta). Šis provider'is, kai
 * vartotojas yra `approved`, VIENU RPC kvietimu (`get_product_prices`) paima
 * visų matomų prekių kainas ir patiekia per kontekstą. Komponentai
 * (`ProductCard`, `ProductPriceBlock`, `StickyBuyBar`) skaito per
 * `useProductPrice(id)`.
 *
 * Jei provider'io nėra (pvz. dar dinaminiai listingų puslapiai 2 fazėje),
 * `useProductPrice` grąžina `price: null` — komponentas tuomet naudoja iš
 * serverio gautą prop kainą (fallback). Taip komponentai veikia ir statiniame,
 * ir dinaminiame kontekste.
 */

export type ClientPrice = {
  priceCents: number
  salePriceCents: number | null
  comparePriceCents: number | null
}

type Ctx = {
  /** Ar provider'is apskritai sumontuotas (skiria fallback atvejį). */
  mounted: boolean
  prices: Map<string, ClientPrice>
  isLoading: boolean
}

const ProductPricesContext = createContext<Ctx>({
  mounted: false,
  prices: new Map(),
  isLoading: false,
})

export function ProductPricesProvider({
  ids,
  children,
}: {
  ids: string[]
  children: React.ReactNode
}) {
  const { isVerified, isLoading: verifLoading } = useVerification()
  const [prices, setPrices] = useState<Map<string, ClientPrice>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Stabili priklausomybė — surūšiuotų ID sąrašas (kad eilės tvarka nekeistų).
  const idsKey = [...ids].sort().join(',')

  useEffect(() => {
    // Kol verifikacija dar kraunasi — laikom „kraunasi" būseną.
    if (verifLoading) {
      setIsLoading(true)
      return
    }
    // Nepatvirtintas / svečias — kainų neimam (komponentas rodys „prisijunkite").
    if (!isVerified || ids.length === 0) {
      setPrices(new Map())
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    const supabase = createBrowserSupabase()
    supabase
      .rpc('get_product_prices', { p_ids: ids })
      .then(({ data, error }) => {
        if (cancelled) return
        const next = new Map<string, ClientPrice>()
        if (error) {
          console.warn('[ProductPrices] get_product_prices failed:', error.message)
        } else if (Array.isArray(data)) {
          for (const row of data as Array<{
            product_id: string
            price_cents: number
            sale_price_cents: number | null
            compare_price_cents: number | null
          }>) {
            next.set(row.product_id, {
              priceCents: row.price_cents,
              salePriceCents: row.sale_price_cents,
              comparePriceCents: row.compare_price_cents,
            })
          }
        }
        setPrices(next)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // idsKey pakeičia ids masyvo identitetą stabiliai
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified, verifLoading, idsKey])

  return (
    <ProductPricesContext.Provider value={{ mounted: true, prices, isLoading }}>
      {children}
    </ProductPricesContext.Provider>
  )
}

export type UseProductPriceResult = {
  /** Užkrauta kaina, arba null (nėra provider'io / svečias / dar kraunasi). */
  price: ClientPrice | null
  /** Ar kainos dar kraunamos (rodyti „kraunasi" vietoj „prisijunkite"). */
  isLoading: boolean
  /** Ar provider'is sumontuotas (komponentas žino, ar naudoti fallback prop'ą). */
  hasProvider: boolean
}

export function useProductPrice(productId: string): UseProductPriceResult {
  const ctx = useContext(ProductPricesContext)
  return {
    price: ctx.prices.get(productId) ?? null,
    isLoading: ctx.isLoading,
    hasProvider: ctx.mounted,
  }
}
