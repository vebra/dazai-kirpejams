import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'

/**
 * Viešų formų rate-limiting.
 *
 * Skaičiuojama Supabase pusėje per `check_rate_limit` RPC (žr. migraciją
 * 020_rate_limits.sql). IP'as sūdomas ir hash'uojamas SHA-256 — lentelėje
 * nelaikom raw IP, todėl tai ne-PII.
 *
 * Dev aplinkoje (Supabase nesukonfigūruotas) — visada leidžiam, nes
 * neturim kur skaičiuoti. Prodas visada turi service-role env'ą.
 */

/**
 * IP sūdymo salt. Anksčiau buvo viešai žinomas hardcoded fallback —
 * jį nustačius prodas hash'uodavo IP'us nuspėjamai (pseudonimizacija
 * atstatoma, rate-limit raktai prognozuojami).
 *
 *  - Yra env → naudojam jį (stabilūs kibirai tarp instancijų; nustatom Vercel'e).
 *  - Prod be env → atsitiktinis salt per procesą: IP'ai lieka neatsekami,
 *    kibiriai gali skirtis tarp lambda instancijų (priimtina vs. žinomas salt).
 *  - Dev be env → stabilus dev salt, kad kibiriai nuoseklūs tarp restartų.
 */
const IP_SALT =
  process.env.RATE_LIMIT_SALT ??
  (process.env.NODE_ENV === 'production'
    ? randomBytes(32).toString('hex')
    : 'dk-rate-limit-dev-salt')

export type RateLimitOptions = {
  /** Logical bucket, pvz. "newsletter" arba "contact". */
  action: string
  /** Lango dydis sekundėmis. Default: 60. */
  windowSeconds?: number
  /** Max pateikimų per langą. Default: 5. */
  max?: number
  /**
   * Jei RPC nepavyksta — blokuoti (true) ar praleisti (false, default).
   *
   * Viešoms formoms (kontaktai, naujienlaiškis) fail-open priimtina: geriau
   * praleisti vieną pateikimą nei trikdyti tikrą vartotoją per Supabase blyksnį.
   * Bet AUTENTIFIKACIJAI (admin/rep login) naudojam fail-closed — limiteris
   * yra brute-force barjeras, todėl jo „dingimas" neturi atverti neribotų
   * bandymų. Esant klaidai grąžinam `allowed:false` su saugiu retry langu.
   */
  failClosed?: boolean
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Ištraukiam kliento IP. SVARBU: `x-forwarded-for` PIRMU elementu pasitikėti
 * negalima — Vercel kliento IP PRIDEDA gale, o piktavalis gali atsiųsti savo
 * header'į ir taip kiekvienam request'ui gauti „naują" IP (limiterio bypass).
 * Todėl: `x-real-ip` (jį nustato pati platforma) → PASKUTINIS XFF elementas.
 */
async function getClientIpHash(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  const realIp = h.get('x-real-ip')
  const ip =
    realIp?.trim() ||
    forwarded?.split(',').pop()?.trim() ||
    'unknown'

  return createHash('sha256').update(`${IP_SALT}:${ip}`).digest('hex').slice(0, 32)
}

export async function checkRateLimit(
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  if (!isSupabaseServerConfigured) {
    return { allowed: true }
  }

  const { action, windowSeconds = 60, max = 5, failClosed = false } = opts
  const ipHash = await getClientIpHash()
  const key = `${action}:ip:${ipHash}`

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: max,
  })

  if (error) {
    if (failClosed) {
      // Autentifikacija: klaida = blokuojam, kad limiterio gedimas neatvertų
      // neriboto brute-force lango. Grąžinam saugų retry langą.
      console.error('[rate-limit] RPC error, fail-closed:', error.message)
      return { allowed: false, retryAfterSeconds: windowSeconds }
    }
    // Viešos formos: neblokuojam vartotojo, bet log'inam, kad Sentry pagautų
    console.error('[rate-limit] RPC error, fail-open:', error.message)
    return { allowed: true }
  }

  const result = data as {
    allowed?: boolean
    retry_after_seconds?: number
  } | null

  if (!result || result.allowed) {
    return { allowed: true }
  }

  return {
    allowed: false,
    retryAfterSeconds: result.retry_after_seconds ?? windowSeconds,
  }
}

/**
 * Honeypot laukas — tuščias `<input name="website">` formoje, paslėptas
 * CSS'u. Tikri vartotojai jo neužpildys; bot'ai paprastai užpildo visus
 * laukus. Jei čia yra reikšmė — atmetam tyliai (apsimesdami sėkme, kad
 * bot'as nesidomėtų).
 */
export function isHoneypotTriggered(formData: FormData): boolean {
  const value = formData.get('website')
  return typeof value === 'string' && value.trim().length > 0
}
