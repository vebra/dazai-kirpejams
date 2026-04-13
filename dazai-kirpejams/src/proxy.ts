import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import { locales, defaultLocale } from './i18n/config'
import { createProxySupabase } from './lib/supabase/ssr'

function getLocale(request: NextRequest): string {
  try {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const languages = new Negotiator({ headers })
      .languages()
      .filter((l) => l && l !== '*')

    if (languages.length === 0) return defaultLocale

    return match(languages, [...locales], defaultLocale)
  } catch {
    return defaultLocale
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
): Promise<NextResponse | undefined> {
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
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // Jeigu Supabase nesukonfigūruotas arba auth check sudužo — redirect į login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Praleisti statinius failus iš /public
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return

  // /admin/* — atskira šaka, be locale prefikso. Tikrinam auth.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const response = NextResponse.next()
    return await checkAdminAuth(request, response)
  }

  // Jei URL prasideda /lt arba /lt/... — nukreipiam į versiją be prefikso
  // (lietuvių kalba veikia be prefikso)
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const newPath = pathname.replace(`/${defaultLocale}`, '') || '/'
    const url = request.nextUrl.clone()
    url.pathname = newPath
    return NextResponse.redirect(url, 301)
  }

  // Jei URL turi kitą kalbos prefiksą (en, ru) — paliekam kaip yra
  const pathnameHasLocale = locales.some(
    (locale) => locale !== defaultLocale && (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
  )

  if (pathnameHasLocale) return

  // URL be kalbos prefikso — tai lietuvių kalba, rewrite į /lt/...
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|fonts).*)',
  ],
}
