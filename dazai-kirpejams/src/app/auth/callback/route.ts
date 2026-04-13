import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createProxySupabase } from '@/lib/supabase/ssr'
import { defaultLocale } from '@/i18n/config'

/**
 * Supabase Auth email confirmation callback.
 * After user clicks the confirmation link in their email, Supabase redirects
 * here with a `code` query param. We exchange it for a session, then redirect
 * the user to their locale's product page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const lang = searchParams.get('lang') ?? defaultLocale

  if (code) {
    const response = NextResponse.redirect(
      new URL(`/${lang}/produktai`, request.url)
    )
    const supabase = createProxySupabase(request, response)
    await supabase.auth.exchangeCodeForSession(code)
    return response
  }

  // No code — redirect to home
  return NextResponse.redirect(new URL(`/${lang}`, request.url))
}
