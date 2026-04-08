import type { Metadata } from 'next'
import { locales, type Locale } from '@/i18n/config'

/**
 * Kanoninis svetainės URL. Gamybinėje aplinkoje — https://www.dazaikirpejams.lt
 * Lokaliai — http://localhost:3000
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dazaikirpejams.lt'

export const SITE_NAME = 'Dažai Kirpėjams'

/**
 * Sukuria hreflang alternates žemėlapį visiems locale'ams vienam path'ui.
 * Path turi prasidėti „/" ir NETURI turėti locale prefikso (pvz. „/produktai").
 */
export function buildLanguageAlternates(
  pathWithoutLocale: string
): Record<string, string> {
  const path = pathWithoutLocale === '/' ? '' : pathWithoutLocale
  const alternates: Record<string, string> = {}
  for (const loc of locales) {
    alternates[loc] = `${SITE_URL}/${loc}${path}`
  }
  // x-default — numatytasis (LT) crawler'iams, kurie neturi lokalės
  alternates['x-default'] = `${SITE_URL}/lt${path}`
  return alternates
}

/**
 * Sudaro kanoninį URL konkrečiai kalbai + pathui.
 */
export function buildCanonicalUrl(lang: Locale, pathWithoutLocale: string) {
  const path = pathWithoutLocale === '/' ? '' : pathWithoutLocale
  return `${SITE_URL}/${lang}${path}`
}

/**
 * Helper statiniam puslapiui, kad būtų mažiau kartojimo generateMetadata
 * funkcijose. Priima tik path (be locale), kalbą ir turinį.
 */
export function buildPageMetadata({
  lang,
  path,
  title,
  description,
}: {
  lang: Locale
  path: string
  title: string
  description?: string
}): Metadata {
  const canonical = buildCanonicalUrl(lang, path)
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  }
}
