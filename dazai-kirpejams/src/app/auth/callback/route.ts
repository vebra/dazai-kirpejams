import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createProxySupabase } from '@/lib/supabase/ssr'
import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'
import { defaultLocale, locales, type Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

/**
 * `lang` ateina iš URL query (atakuotojo valdoma). Be validacijos
 * `langPrefix('/evil.com')` → `//evil.com`, o `new URL('//evil.com/...', base)`
 * nukreiptų į išorinį domeną (open-redirect / phishing per el. patvirtinimo
 * nuorodą). Leidžiam tik žinomus locale'us; bet kas kita → defaultLocale.
 */
function safeLocale(value: string | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale
}

/**
 * Supabase Auth email confirmation callback.
 * After user clicks the confirmation link in their email, Supabase redirects
 * here with a `code` query param. We exchange it for a session, then redirect
 * the user to their locale's product page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const lang = safeLocale(searchParams.get('lang'))

  if (code) {
    const response = NextResponse.redirect(
      new URL(`${langPrefix(lang)}/produktai`, request.url)
    )
    const supabase = createProxySupabase(request, response)
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code)

    // OAuth vartotojai praleidžia registracijos formą, todėl jų `lang`
    // nepatenka į user_profiles per registerAction. Po sėkmingo session
    // exchange'o atnaujinam profilio kalbą iš callback'o `?lang=` parametro,
    // kad welcome/atmetimo laiškai eitų ta kalba, kurią pasirinko vartotojas.
    // Best-effort: klaida neblokuoja login srauto.
    if (sessionData.user?.id && isSupabaseServerConfigured) {
      try {
        const admin = createServerClient()
        await admin
          .from('user_profiles')
          .update({ lang })
          .eq('id', sessionData.user.id)
      } catch (err) {
        console.error(
          '[auth/callback] profile lang update failed (non-blocking):',
          err
        )
      }
    }
    return response
  }

  // No code — redirect to home
  return NextResponse.redirect(new URL(`${langPrefix(lang) || '/'}`, request.url))
}
