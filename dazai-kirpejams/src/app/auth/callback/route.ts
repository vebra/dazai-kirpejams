import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createProxySupabase } from '@/lib/supabase/ssr'
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
    await supabase.auth.exchangeCodeForSession(code)
    return response
  }

  // No code — redirect to home
  return NextResponse.redirect(new URL(`${langPrefix(lang) || '/'}`, request.url))
}
