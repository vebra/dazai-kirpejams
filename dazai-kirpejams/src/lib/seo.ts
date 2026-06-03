import type { Metadata } from 'next'
import { locales, defaultLocale, type Locale } from '@/i18n/config'

/**
 * Kanoninis svetainės URL. Gamybinėje aplinkoje — https://www.dazaikirpejams.lt
 * Lokaliai — http://localhost:3000
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dazaikirpejams.lt'
).trim()

export const SITE_NAME = 'Dažai Kirpėjams'

/**
 * Statinis OG paveiksliukas (1200×630, JPG). Padengia FB/LinkedIn/Twitter
 * share preview visiems puslapiams, kurie naudoja `buildPageMetadata`.
 * Pagrindiniam puslapiui taip pat veikia file-convention versija
 * `src/app/(site)/[lang]/opengraph-image.jpg` — tas pats failas. Bet
 * pagal Next.js metadata merge logiką, kai page'as nustato `openGraph: {...}`
 * be `images`, vaikų puslapyje rody­tų FB tuščią kortelę. Todėl
 * eksplicitiškai paduodam šitą URL kiekvienam puslapiui.
 */
export const OG_IMAGE_URL = '/og-image.jpg'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

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
    if (loc === defaultLocale) {
      alternates[loc] = `${SITE_URL}${path || '/'}`
    } else {
      alternates[loc] = `${SITE_URL}/${loc}${path}`
    }
  }
  // x-default — numatytasis (LT) crawler'iams, kurie neturi lokalės
  alternates['x-default'] = `${SITE_URL}${path || '/'}`
  return alternates
}

/**
 * Sudaro kanoninį URL konkrečiai kalbai + pathui.
 */
export function buildCanonicalUrl(lang: Locale, pathWithoutLocale: string) {
  const path = pathWithoutLocale === '/' ? '' : pathWithoutLocale
  if (lang === defaultLocale) {
    return `${SITE_URL}${path || '/'}`
  }
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
  imageUrl,
}: {
  lang: Locale
  path: string
  title: string
  description?: string
  /**
   * Pasirinktinė OG nuotrauka (absoliutus URL) — pvz. blogo straipsnio
   * viršelis. Jei nenurodyta, naudojamas numatytasis statinis /og-image.jpg.
   * Su custom URL Facebook/Twitter rodo konkrečios nuotraukos peržiūrą.
   */
  imageUrl?: string | null
}): Metadata {
  const canonical = buildCanonicalUrl(lang, path)
  const ogImages = imageUrl
    ? [{ url: imageUrl }]
    : [
        {
          url: OG_IMAGE_URL,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          type: 'image/jpeg',
        },
      ]
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
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl ?? OG_IMAGE_URL],
    },
  }
}
