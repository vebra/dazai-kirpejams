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

  // Auth OK — tęsiam į admin puslapį per `{ request }`, kad atnaujinta sesija
  // (jeigu token'as ką tik buvo refresh'intas) pasiektų requireAdmin() tame
  // pačiame request'e. Be šito adminą iškart mestų atgal į /admin/login.
  return copyCookies(response, NextResponse.next({ request }))
}

/**
 * Vadybininkės (/vadybininke) zona — analogiška /admin: optimistinis sesijos
 * patikrinimas proxy'je, realų role patikrinimą (sales_rep arba admin) daro
 * requireSalesRep() puslapyje. Login puslapis viešas.
 */
async function checkRepAuth(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (pathname === '/vadybininke/login' || pathname.startsWith('/vadybininke/login/')) {
    return response
  }

  try {
    const supabase = createProxySupabase(request, response)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/vadybininke/login'
      loginUrl.search = ''
      return copyCookies(response, NextResponse.redirect(loginUrl))
    }
  } catch {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/vadybininke/login'
    loginUrl.search = ''
    return copyCookies(response, NextResponse.redirect(loginUrl))
  }

  return copyCookies(response, NextResponse.next({ request }))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Praleisti statinius failus iš /public
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return

  // Lowercase redirect — uppercase URL'ai (pvz. /Produktai, /PRODUKTAI)
  // grąžindavo HTTP 200 ir kūrė duplicate content kanonui /produktai. Šis
  // saugiklis vis dar reikalingas SEO dublikatams.
  //
  // IŠIMTYS: kelią su case-sensitive ID NEGALIMA lowercase'inti. Užsakymo
  // numeris yra formato `DK-260520-160345` (uppercase `DK-` prefiksas) —
  // redirect'inus į lowercase patvirtinimo puslapis grąžindavo 404, nes
  // tiek sausainuko raktas, tiek DB `order_number` palyginimas yra
  // case-sensitive. Tas pats logiškai galiotų bet kokiam keliui po
  // /uzsakymas/ (pvz. /uzsakymas/{nr}/saskaita).
  if (
    /[A-Z]/.test(pathname) &&
    !pathname.startsWith('/_next/') &&
    !/(^|\/)uzsakymas\//.test(pathname)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.toLowerCase()
    return NextResponse.redirect(url, 301)
  }

  // Pradinis response — į jį @supabase/ssr rašo atnaujintus cookie'ius
  // (Set-Cookie naršyklei), o request.cookies mutuojami vietoje. Tęsiamieji
  // atsakymai grąžinami per `NextResponse.next({ request })` /
  // `rewrite(url, { request })`, kad atnaujinta sesija pasiektų serverio
  // komponentus tame pačiame request'e. Redirect'ai cookie'ius perkelia per
  // `copyCookies` (naršyklė vis tiek persikrauna su nauju Set-Cookie).
  const response = NextResponse.next()

  // /admin/* — atskira šaka su savo auth logika (taip pat refresh'ina sesiją)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return await checkAdminAuth(request, response)
  }

  // /vadybininke/* — vadybininkės sritis (atskira šaka, sava auth logika)
  if (pathname === '/vadybininke' || pathname.startsWith('/vadybininke/')) {
    return await checkRepAuth(request, response)
  }

  // /auth/* (pvz. /auth/callback) — Supabase OAuth callback route'os
  // gyvena ne po [lang] segmento. Be šito guard'o middleware'as rewrite'intų
  // /auth/callback į /lt/auth/callback ir gautume 404 po Google/Facebook login.
  if (pathname.startsWith('/auth/')) {
    return response
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

  if (pathnameHasLocale) {
    return copyCookies(response, NextResponse.next({ request }))
  }

  // URL be kalbos prefikso — tai lietuvių kalba, rewrite į /lt/...
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return copyCookies(response, NextResponse.rewrite(request.nextUrl, { request }))
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|fonts|monitoring).*)',
  ],
}
