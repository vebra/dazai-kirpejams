/**
 * Analytics pagalbinės funkcijos:
 *  - `analyticsEnabled()` — global'us jungtuvas per env
 *  - `hasConsent()` — cookie consent iš localStorage
 *  - `canTrack()` — abu kartu
 *  - `dedupeOncePerSession(key)` — Purchase/CalculatorUsed ir pan.
 */

const CONSENT_STORAGE_KEY = 'cookie-consent-v1'
const SESSION_PREFIX = 'dk-analytics-'

const PRODUCTION_HOSTS = new Set([
  'dazaikirpejams.lt',
  'www.dazaikirpejams.lt',
])

export function isProductionHost(): boolean {
  if (typeof window === 'undefined') return false
  return PRODUCTION_HOSTS.has(window.location.hostname.toLowerCase())
}

export function analyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const envFlag = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS
  if (envFlag === 'false' || envFlag === '0') return false
  // Preview/localhost — netriggerintume GA/Meta įvykių, kad nedirbtume
  // Lietuvos rinkos statistikos su JAV cloud'o botų srautu.
  if (!isProductionHost()) return false
  return true
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function canTrack(): boolean {
  return analyticsEnabled() && hasConsent()
}

/**
 * Per sesiją (sessionStorage) leidžia event'ą fire'inti tik vieną kartą
 * tam tikram raktui. Naudojama:
 *  - Purchase — kad refresh'as ar back-button neduplikuotų order'io
 *  - CalculatorUsed — kad reaktyviai perrenderuodami kiekvieno inputo
 *    pasikeitimo netriggerintume event'o kas kart
 *  - PriceView — kad kiekvieną kart per-render'inant produkto puslapį
 *    nekvepintume Meta'os tuo pačiu event'u
 *
 * Grąžina `true`, jei event'as dar NEBUVO fire'intas šioje sesijoje
 * (t.y. šaukiantysis gali jį fire'inti). `false` — jau fire'intas.
 */
export function dedupeOncePerSession(key: string): boolean {
  if (typeof window === 'undefined') return false
  const fullKey = `${SESSION_PREFIX}${key}`
  try {
    if (sessionStorage.getItem(fullKey) === '1') return false
    sessionStorage.setItem(fullKey, '1')
    return true
  } catch {
    return true
  }
}

/**
 * Saugus wrapper'is — jei callback'as mes error'ą, neleidžia jam užgriūti
 * realaus UI kodo. Meta Pixel ar GA4 niekada nelaužo svetainės.
 */
export function safeCall(fn: () => void, tag: string): void {
  try {
    fn()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[analytics] ${tag} failed:`, err)
    }
  }
}
