/**
 * GA4 kanalas. Vienintelė vieta, kur kviečiamas `window.gtag()` —
 * visi UI komponentai turi naudoti `analytics.ts` semantines funkcijas.
 *
 * GA4 paleidžiamas `(site)/[lang]/layout.tsx` su consent mode — event'ai,
 * kurie nukrito kol consent = 'denied', GA4 automatiškai pamirš.
 */

import { safeCall } from './analytics-utils'

type GtagFunction = (...args: unknown[]) => void

function getGtag(): GtagFunction | null {
  if (typeof window === 'undefined') return null
  const gtag = (window as unknown as { gtag?: GtagFunction }).gtag
  return typeof gtag === 'function' ? gtag : null
}

/**
 * GA4 event'as. `event_name` turi būti GA4 standard arba custom.
 * Enhanced Ecommerce naudoja `items: [{ item_id, item_name, ... }]`.
 */
export function ga4Event(
  eventName: string,
  params?: Record<string, unknown>
): void {
  const gtag = getGtag()
  if (!gtag) return
  safeCall(() => {
    gtag('event', eventName, params ?? {})
  }, `ga4Event:${eventName}`)
}

/**
 * Page view atskirai per `config` call'ą, kad GA4 paimtų teisingą URL
 * po client-side navigacijos (default'e GA4 fiksuoja tik pirmą load'ą).
 */
export function ga4PageView(pagePath: string, pageTitle?: string): void {
  const gtag = getGtag()
  if (!gtag) return
  safeCall(() => {
    gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: pageTitle ?? document.title,
    })
  }, 'ga4PageView')
}
