import 'server-only'
import { createHash } from 'node:crypto'
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

const IP_SALT = process.env.RATE_LIMIT_SALT ?? 'dk-rate-limit-fallback-salt'

export type RateLimitOptions = {
  /** Logical bucket, pvz. "newsletter" arba "contact". */
  action: string
  /** Lango dydis sekundėmis. Default: 60. */
  windowSeconds?: number
  /** Max pateikimų per langą. Default: 5. */
  max?: number
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Ištraukiam kliento IP iš standartinių proxy header'ių. Vercel'e
 * `x-forwarded-for` yra comma-separated sąrašas, pirmas — originalus
 * kliento adresas.
 */
async function getClientIpHash(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  const realIp = h.get('x-real-ip')
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    realIp?.trim() ||
    'unknown'

  return createHash('sha256').update(`${IP_SALT}:${ip}`).digest('hex').slice(0, 32)
}

export async function checkRateLimit(
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  if (!isSupabaseServerConfigured) {
    return { allowed: true }
  }

  const { action, windowSeconds = 60, max = 5 } = opts
  const ipHash = await getClientIpHash()
  const key = `${action}:ip:${ipHash}`

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: max,
  })

  if (error) {
    // Jei RPC nepavyko — neblokuojam vartotojo, bet log'inam, kad Sentry pagautų
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
