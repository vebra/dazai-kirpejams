import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

const LOCALE_SET = new Set<string>(locales)

/**
 * Middleware — kalbos redirect ir Supabase auth cookie forwarding.
 *
 * 1. Jei URL neturi locale prefiks (pvz. „/produktai") — nukreipia į „/lt/produktai"
 *    arba į naršyklės Accept-Language kalbą (jei palaikoma).
 * 2. Praleidžia statinius failus, API, admin, auth routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Praleisti statinius failus, API, admin, auth, Next.js vidines routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/icon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/og-image.jpg' ||
    pathname === '/favicon.ico' ||
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js)$/i.test(pathname)
  )  {
    return NextResponse.next()
  }

  // Patikrinti ar jau turi locale prefixą
  const segments = pathname.split('/')
  const firstSegment = segments[1] // segments[0] yra tuščias ("")
  if (LOCALE_SET.has(firstSegment)) {
    return NextResponse.next()
  }

  // Nustatyti kalbą iš Accept-Language header
  const acceptLang = request.headers.get('accept-language') || ''
  let detectedLocale = defaultLocale
  for (const locale of locales) {
    if (acceptLang.toLowerCase().includes(locale)) {
      detectedLocale = locale
      break
    }
  }

  // Redirect: /produktai → /lt/produktai
  const url = request.nextUrl.clone()
  url.pathname = `/${detectedLocale}${pathname}`
  return NextResponse.redirect(url, 307)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
