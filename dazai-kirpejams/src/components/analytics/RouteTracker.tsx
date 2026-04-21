'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

/**
 * Fire'ina PageView (Meta + GA4) kiekvieno client-side route pasikeitimo
 * metu. Next.js App Router pats NEFIRE'ina page_view po <Link> navigacijos,
 * todėl to reikia imtis rankomis.
 *
 * Įdiegiamas root layout'e, po `VerificationProvider`. Skaitymas vyksta
 * `useEffect` — tai reiškia, kad pirmas PageView fire'ina po hydration'o.
 * Kad nebūtų dublikato su inline Pixel init'o PageView'u, INLINE PageView
 * iš layout.tsx pašalintas — Pixel init'as palieka tik `fbq('init', ...)`.
 */
export function RouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    const query = searchParams?.toString()
    const fullPath = query ? `${pathname}?${query}` : pathname
    trackPageView(fullPath)
  }, [pathname, searchParams])

  return null
}
