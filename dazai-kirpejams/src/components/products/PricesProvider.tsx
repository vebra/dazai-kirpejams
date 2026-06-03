'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useVerification } from '@/components/auth/VerificationProvider'

type PriceEntry = { priceCents: number; comparePriceCents: number | null }

type PricesContextValue = {
  // undefined = dar nekrauta, null = nėra kainos (svečias/nerasta), objektas = kaina
  prices: Record<string, PriceEntry | null>
  register: (slug: string) => void
  isVerified: boolean
  verificationLoading: boolean
}

const PricesContext = createContext<PricesContextValue>({
  prices: {},
  register: () => {},
  isVerified: false,
  verificationLoading: false,
})

/**
 * Tiekia produktų kainas klientui per autentifikuotą `/api/prices`. Kaina
 * NIEKADA nepatenka į statinį HTML — ji pasiimama čia tik patvirtintiems
 * profesionalams. Svečiams grąžinama null (rodoma „registruokitės").
 *
 * Slug'ai, kuriuos užregistruoja `usePrice`, sukaupiami ir užklausiami
 * paketais (vienas POST keliems produktams sąraše).
 */
export function PricesProvider({ children }: { children: React.ReactNode }) {
  const { isVerified, isLoading } = useVerification()
  const [requested, setRequested] = useState<Set<string>>(() => new Set())
  const [prices, setPrices] = useState<Record<string, PriceEntry | null>>({})

  const register = useCallback((slug: string) => {
    if (!slug) return
    setRequested((prev) => {
      if (prev.has(slug)) return prev
      const next = new Set(prev)
      next.add(slug)
      return next
    })
  }, [])

  useEffect(() => {
    if (isLoading) return
    const toFetch = Array.from(requested).filter((s) => !(s in prices))
    if (toFetch.length === 0) return

    // Svečias / nepatvirtintas — jokio fetch'o, žymim kaip „nėra kainos".
    if (!isVerified) {
      setPrices((prev) => {
        const next = { ...prev }
        for (const s of toFetch) next[s] = null
        return next
      })
      return
    }

    let cancelled = false
    fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: toFetch }),
    })
      .then((r) => (r.ok ? r.json() : { prices: {} }))
      .then((data: { prices?: Record<string, PriceEntry> }) => {
        if (cancelled) return
        const fetched = data.prices ?? {}
        setPrices((prev) => {
          const next = { ...prev }
          for (const s of toFetch) next[s] = fetched[s] ?? null
          return next
        })
      })
      .catch(() => {
        if (cancelled) return
        setPrices((prev) => {
          const next = { ...prev }
          for (const s of toFetch) next[s] = null
          return next
        })
      })
    return () => {
      cancelled = true
    }
  }, [requested, prices, isVerified, isLoading])

  return (
    <PricesContext.Provider
      value={{ prices, register, isVerified, verificationLoading: isLoading }}
    >
      {children}
    </PricesContext.Provider>
  )
}

export type UsePriceResult = {
  priceCents: number | null
  comparePriceCents: number | null
  /** Kaina dar kraunama (verifikacija arba fetch vyksta). */
  loading: boolean
  isVerified: boolean
}

/** Grąžina produkto kainą klientui. Svečiui — null + loading=false. */
export function usePrice(slug: string): UsePriceResult {
  const ctx = useContext(PricesContext)
  const { register } = ctx

  useEffect(() => {
    register(slug)
  }, [slug, register])

  const entry = ctx.prices[slug]
  const loading =
    ctx.verificationLoading || (ctx.isVerified && entry === undefined)

  return {
    priceCents: entry ? entry.priceCents : null,
    comparePriceCents: entry ? entry.comparePriceCents : null,
    loading,
    isVerified: ctx.isVerified,
  }
}
