import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from './i18n/config'
import { createProxySupabase } from './lib/supabase/ssr'

/**
 * Kopijuoja Set-Cookie antraštes iš vieno response į kitą. Reikalinga, kai
 * po sesijos refresh'o turime grąžinti `redirect`/`rewrite` — kitaip naujai
 * išrašyti cookie'iai nepasiektų naršyklės.
 */
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
  return to
}

/**
 * Atnaujina Supabase sesijos cookie'ius kiekvienai request'ui, kuriuose yra
 * auth cookie'iai. Be šio šauksmo access_token'ai užgęsta po ~1 val., o
 * refresh_token niekad nebūtų panaudotas — rezultate vartotojams nematomai
 * „atsijungiama", jie pamato „Prisijungti" tekstą ir kainos dingsta, nors
 * formaliai turi galiojančią sesiją.
 *
 * Praleidžiam šauksmą anoniminiam srautui — kad botai/crawler'iai nemokamai
 * negrūstų Supabase auth serverio.
 */
async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-'))
  if (!hasAuthCookie) return

  try {
    const supabase = createProxySupabase(request, response)
    await supabase.auth.getUser()
  } catch {
    // Ignoruojam — Supabase gali būti nesukonfigūruotas arba sesija negaliojanti.
    // Klaidos atveju paliekam cookie'ius kaip yra; klientas pats pamatys, kad
    // sesija negaliojanti ir pasiūlys prisijungti iš naujo.
  }
}

/**
 * Optimistinis admin auth patikrinimas proxy'je — žr. Next.js 16 auth
 * rekomendaciją: proxy'je atliekame tik cookie egzistavimo patikrą +
 * Supabase `getUser()` žetono validaciją. Realų email allow-list
 * patikrinimą daro `requireAdmin()` kiekviename admin puslapyje.
 */
async function checkAdminAuth(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Login puslapis prieinamas visiems
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return response
  }

  try {
    const supabase = createProxySupabase(request, response)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.search = ''
      return copyCookies(response, NextResponse.redirect(loginUrl))
    }
  } catch {
    // Jeigu Supabase nesukonfigūruotas arba auth check sudužo — redirect į login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    return copyCookies(response, NextResponse.redirect(loginUrl))
  }

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Praleisti statinius failus iš /public
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return

  // Pradinis response — į jį @supabase/ssr rašo atnaujintus cookie'ius.
  // Kiekvienas žemiau grąžinamas redirect/rewrite turi šiuos cookie'ius
  // perkelti per `copyCookies`.
  const response = NextResponse.next()

  // /admin/* — atskira šaka su savo auth logika (taip pat refresh'ina sesiją)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return await checkAdminAuth(request, response)
  }

  // Visiems kitiems route'ams refresh'inam Supabase sesiją, kad access_token
  // nepasensta naršymo metu.
  await refreshSupabaseSession(request, response)

  // Jei URL prasideda /lt arba /lt/... — nukreipiam į versiją be prefikso
  // (lietuvių kalba veikia be prefikso)
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const newPath = pathname.replace(`/${defaultLocale}`, '') || '/'
    const url = request.nextUrl.clone()
    url.pathname = newPath
    return copyCookies(response, NextResponse.redirect(url, 301))
  }

  // Jei URL turi kitą kalbos prefiksą (en, ru) — paliekam kaip yra
  const pathnameHasLocale = locales.some(
    (locale) =>
      locale !== defaultLocale &&
      (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
  )

  if (pathnameHasLocale) return response

  // URL be kalbos prefikso — tai lietuvių kalba, rewrite į /lt/...
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return copyCookies(response, NextResponse.rewrite(request.nextUrl))
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|fonts).*)',
  ],
}
