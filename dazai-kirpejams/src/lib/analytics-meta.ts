/**
 * Meta Pixel kanalas. Vienintelė vieta, kur kviečiamas `window.fbq()` —
 * visi UI komponentai turi naudoti `analytics.ts` semantines funkcijas.
 *
 * Pixel inicializacija vyksta `(site)/[lang]/layout.tsx` su consent=revoked
 * pagal nutylėjimą. Šis modulis TIK siunčia event'us ir tik tada, kai
 * `canTrack()` grąžina `true`.
 */

import { safeCall } from './analytics-utils'

type FbqFunction = (...args: unknown[]) => void

function getFbq(): FbqFunction | null {
  if (typeof window === 'undefined') return null
  const fbq = (window as unknown as { fbq?: FbqFunction }).fbq
  return typeof fbq === 'function' ? fbq : null
}

/**
 * Standartinis Meta event'as (track). Meta automatiškai optimizuoja
 * reklamą ant šių event'ų — naudoti būtent šiuos pavadinimus:
 * PageView, ViewContent, AddToCart, InitiateCheckout, Purchase,
 * Lead, CompleteRegistration, Subscribe, Search, Contact.
 *
 * `eventId` (neprivaloma) — naudojama CAPI dedupe. Tie patys Purchase/
 * Lead event'ai siunčiami ir iš server'io per Conversions API; Meta
 * match'ina abu signalus per 48h langą ir palieka tik vieną.
 */
export function metaTrack(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  const fbq = getFbq()
  if (!fbq) return
  safeCall(() => {
    if (eventId) {
      fbq('track', eventName, params ?? {}, { eventID: eventId })
    } else if (params) {
      fbq('track', eventName, params)
    } else {
      fbq('track', eventName)
    }
  }, `metaTrack:${eventName}`)
}

/**
 * Custom event'as (trackCustom). Naudojamas ne-standartiniams event'ams:
 * PriceUnlockClick, PriceView, Login, PhoneClick, EmailClick,
 * WhatsAppClick, CalculatorUsed.
 */
export function metaTrackCustom(
  eventName: string,
  params?: Record<string, unknown>
): void {
  const fbq = getFbq()
  if (!fbq) return
  safeCall(() => {
    if (params) {
      fbq('trackCustom', eventName, params)
    } else {
      fbq('trackCustom', eventName)
    }
  }, `metaTrackCustom:${eventName}`)
}
