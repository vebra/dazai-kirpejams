import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service role klientas — pilnas DB priėjimas, apeina RLS.
 * NAUDOTI TIK server-side (API routes, Server Actions, scripts).
 * Niekada neteikti anon kliento vietoje šio, jei reikia rašymo operacijų
 * su elevated privileges (orders, webhooks, admin tools).
 */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !url ||
    !serviceKey ||
    url.includes('your-supabase') ||
    serviceKey.includes('your-supabase')
  ) {
    throw new Error(
      'Supabase nesukonfigūruotas. Nustatykite NEXT_PUBLIC_SUPABASE_URL ir SUPABASE_SERVICE_ROLE_KEY .env.local faile.'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export const isSupabaseServerConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase') &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase')
)
