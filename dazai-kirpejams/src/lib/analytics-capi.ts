/**
 * Meta Conversions API (CAPI) — server-side event kanalas.
 *
 * Kodėl reikia:
 *   iOS 14.5+, Safari ITP ir ad-blocker'iai blokuoja 20–40% browser-side
 *   Pixel event'ų. CAPI siunčia tuos pačius event'us tiesiai iš serverio
 *   į Meta Graph API, o dedupe per `event_id` užtikrina, kad vartotojas
 *   NELIKS su dvigubai suskaičiuotu Purchase/Lead.
 *
 * Dedupe taisyklė:
 *   - Client Pixel siunčia `fbq('track', 'Purchase', data, { eventID })`
 *   - Server CAPI siunčia tą patį event'ą su `event_id = eventID`
 *   - Meta per 48h langą match'ina abu signalus ir palieka tik vieną
 *
 * Privatumas:
 *   - Visi PII (el. paštas, telefonas, vardas) hash'inami SHA-256 prieš
 *     siuntimą (Meta reikalavimas)
 *   - Telefonas normalizuojamas į E.164 skaitmenis (be „+" ir tarpų)
 *   - El. paštas lowercased ir trimmed
 *
 * Konfigūracija:
 *   - `META_PIXEL_ID` — tas pats kaip `NEXT_PUBLIC_META_PIXEL_ID`
 *   - `META_CAPI_ACCESS_TOKEN` — slaptas (Meta Events Manager →
 *     Settings → Conversions API → Generate access token)
 *   - `META_CAPI_TEST_EVENT_CODE` — NEBŪTINAS, naudoti TIK staging/dev
 *     (Events Manager → Test Events → Test Event Code). Padeda realtime
 *     debug. Jei paliksi prod'e, event'ai bus atskirti į „Test" srautą.
 */
import { createHash } from 'node:crypto'
import { cookies, headers } from 'next/headers'

const GRAPH_API_VERSION = 'v23.0'

type UserDataInput = {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
}

type CapiEvent = {
  eventName: string
  eventId: string
  eventSourceUrl?: string
  actionSource?: 'website' | 'email' | 'app' | 'chat'
  userData: UserDataInput
  customData?: Record<string, unknown>
}

type FbqUserData = {
  em?: string[]
  ph?: string[]
  fn?: string[]
  ln?: string[]
  ct?: string[]
  zp?: string[]
  country?: string[]
  client_ip_address?: string
  client_user_agent?: string
  fbp?: string
  fbc?: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const cleaned = email.trim().toLowerCase()
  return cleaned.length > 0 ? cleaned : null
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits.length > 0 ? digits : null
}

function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null
  const cleaned = name.trim().toLowerCase()
  return cleaned.length > 0 ? cleaned : null
}

async function resolveClientSignals(): Promise<{
  ip: string | undefined
  userAgent: string | undefined
  fbp: string | undefined
  fbc: string | undefined
  sourceUrl: string | undefined
}> {
  const h = await headers()
  const c = await cookies()

  // X-Forwarded-For gali turėti kelis IP — pirmasis yra kliento.
  // Vercel rašo `x-forwarded-for` automatiškai; fallback'inam į
  // `x-real-ip` arba tuštumą (tada Meta naudos event tik pixel match'ui).
  const forwardedFor = h.get('x-forwarded-for')
  const ip =
    forwardedFor?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    undefined

  const userAgent = h.get('user-agent') ?? undefined

  // `_fbp` ir `_fbc` — Meta Pixel'o cookie'ės, kritiškai svarbios event
  // match'ui. `_fbc` egzistuoja tik jei useris atėjo su `?fbclid=...`
  // query parametru; `_fbp` nustato pats Pixel pirmam apsilankyme.
  const fbp = c.get('_fbp')?.value
  const fbc = c.get('_fbc')?.value

  // Event source URL — naudojam Referer, nes server action'ai neturi
  // tiesioginio URL konteksto. Jei jo nėra — praleidžiam.
  const sourceUrl = h.get('referer') ?? undefined

  return { ip, userAgent, fbp, fbc, sourceUrl }
}

function buildUserDataHashes(
  input: UserDataInput,
  signals: Awaited<ReturnType<typeof resolveClientSignals>>
): FbqUserData {
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)
  const firstName = normalizeName(input.firstName)
  const lastName = normalizeName(input.lastName)
  const city = normalizeName(input.city)
  const zip = input.postalCode?.trim().toLowerCase() || null
  const country = input.country?.trim().toLowerCase() || null

  const userData: FbqUserData = {}
  if (email) userData.em = [sha256(email)]
  if (phone) userData.ph = [sha256(phone)]
  if (firstName) userData.fn = [sha256(firstName)]
  if (lastName) userData.ln = [sha256(lastName)]
  if (city) userData.ct = [sha256(city)]
  if (zip) userData.zp = [sha256(zip)]
  if (country) userData.country = [sha256(country)]
  if (signals.ip) userData.client_ip_address = signals.ip
  if (signals.userAgent) userData.client_user_agent = signals.userAgent
  if (signals.fbp) userData.fbp = signals.fbp
  if (signals.fbc) userData.fbc = signals.fbc

  return userData
}

/**
 * Vienintelė vieta, per kurią siunčiami CAPI event'ai. UI kodas CAPI'o
 * tiesiogiai nekviečia — kviečia server action'ai po sėkmingo DB įrašo.
 *
 * Grąžina `void` — CAPI klaidos NEBLOKUOJA kliento flow'o. Jas log'inam
 * į console ir einam toliau, užsakymas svarbesnis nei analytics.
 */
export async function sendMetaCapiEvent(event: CapiEvent): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE

  if (!pixelId || !accessToken) {
    // Silently skip — CAPI tiesiog nesukonfigūruotas. Tai normalu dev'e
    // arba kol neįdiegtas token'as Vercel'e.
    return
  }

  try {
    const signals = await resolveClientSignals()
    const userData = buildUserDataHashes(event.userData, signals)

    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl ?? signals.sourceUrl,
          action_source: event.actionSource ?? 'website',
          user_data: userData,
          custom_data: event.customData ?? {},
        },
      ],
      ...(testCode ? { test_event_code: testCode } : {}),
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken
    )}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Nenorime cache'inti; kiekvienas CAPI request'as turi pasiekti Meta.
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(
        `[capi] ${event.eventName} failed: ${res.status} ${res.statusText}`,
        text.slice(0, 500)
      )
    }
  } catch (err) {
    console.error(`[capi] ${event.eventName} threw:`, err)
  }
}
