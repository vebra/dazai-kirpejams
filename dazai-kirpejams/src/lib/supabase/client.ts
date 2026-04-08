import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Patikrina, ar Supabase env kintamieji yra nustatyti realiomis reikšmėmis.
 * Grąžina false, kai matome placeholder reikšmes iš .env.local šablono,
 * kad būtų galima naudoti mock duomenis kūrimo metu.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase') &&
    !supabaseAnonKey.includes('your-supabase')
)

let _browserClient: SupabaseClient | null = null

/**
 * Anon kliento gavimas (viešas skaitymas, RLS policy'ų ribose).
 * Naudojamas tiek RSC'ose, tiek client komponentuose.
 * Grąžina null, jei Supabase nesukonfigūruotas — kviečianti funkcija
 * turi tai tvarkyti (dažniausiai — fallback į mock duomenis).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!_browserClient) {
    _browserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    })
  }
  return _browserClient
}

/**
 * Backwards compatible eksportas — gali būti null, jei nesukonfigūruota.
 */
export const supabase = getSupabase()
