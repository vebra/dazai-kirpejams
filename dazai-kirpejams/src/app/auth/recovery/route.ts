import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createProxySupabase } from '@/lib/supabase/ssr'
import { defaultLocale, locales, type Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

/**
 * Slaptažodžio atstatymo callback'as. Supabase Auth recovery link'as
 * (sugeneruotas per `admin.generateLink({ type: 'recovery' })`) atveda čia
 * su `?code=` ir `?lang=`. Iškeičiam kodą į sesiją ir redirektinam į
 * `/{lang}/naujas-slaptazodis`, kur klientas nustato naują slaptažodį.
 *
 * Atskira nuo `/auth/callback`, kuri tarnauja email confirmation srautui
 * (po confirm'o → /produktai). Recovery turi savo redirect tikslą, ir
 * sumaišyti dvi srautas viename route — lengvas atviras redirect rizikos
 * šaltinis.
 */
function safeLocale(value: string | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const lang = safeLocale(searchParams.get('lang'))

  const target = new URL(
    `${langPrefix(lang)}/naujas-slaptazodis`,
    request.url
  )

  if (!code) {
    // Nuoroda be code — siunčiam į prisijungimo puslapį su klaida (recovery
    // sesijos nesukurta, klientas turės iš naujo paprašyti atstatymo).
    return NextResponse.redirect(
      new URL(`${langPrefix(lang)}/prisijungimas?reset=expired`, request.url)
    )
  }

  const response = NextResponse.redirect(target)
  const supabase = createProxySupabase(request, response)
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/recovery] exchange failed:', error.message)
    return NextResponse.redirect(
      new URL(`${langPrefix(lang)}/prisijungimas?reset=expired`, request.url)
    )
  }

  return response
}
