import { createBrowserClient } from '@supabase/ssr'

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (
    !url ||
    !anonKey ||
    url.includes('your-supabase') ||
    anonKey.includes('your-supabase')
  ) {
    throw new Error(
      'Supabase Auth nesukonfigūruotas. Nustatykite NEXT_PUBLIC_SUPABASE_URL ir NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local faile.'
    )
  }
  return { url, anonKey }
}

/** Client-side (browser) klientas — naudoti 'use client' komponentuose */
export function createBrowserSupabase() {
  const { url, anonKey } = getEnv()
  return createBrowserClient(url, anonKey)
}
