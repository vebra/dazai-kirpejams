'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { cn, langPrefix } from '@/lib/utils'

type LocaleSwitcherProps = {
  currentLocale: Locale
  variant?: 'header' | 'mobile'
}

/**
 * Kalbos perjungimas išsaugant DABARTINĮ puslapį (auditas B34): anksčiau
 * nuoroda visada vesdavo į kalbos pradinį puslapį ir vartotojas prarasdavo
 * kontekstą (pvz. iš produkto puslapio). URL segmentai tarp kalbų sutampa
 * (lt be prefikso, en/ru su /en /ru), tad užtenka perrašyti prefiksą.
 * Query parametrai (filtrai) nepernešami sąmoningai — jiems reikėtų
 * useSearchParams + Suspense, o filtrų praradimas keičiant kalbą yra
 * priimtinas kompromisas.
 */
export function LocaleSwitcher({
  currentLocale,
  variant = 'header',
}: LocaleSwitcherProps) {
  const pathname = usePathname() || '/'

  // Nuimam dabartinės kalbos prefiksą — lieka kelias be lokalės.
  const currentPrefix = langPrefix(currentLocale)
  const pathWithoutLocale =
    currentPrefix && pathname.startsWith(currentPrefix)
      ? pathname.slice(currentPrefix.length) || '/'
      : pathname

  const hrefFor = (locale: Locale): string => {
    if (locale === defaultLocale) return pathWithoutLocale
    return `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
  }

  return (
    <div
      className={cn(
        'items-center gap-1 text-xs font-medium',
        variant === 'header' ? 'hidden sm:flex' : 'flex'
      )}
    >
      {locales.map((locale, idx) => (
        <span key={locale} className="flex items-center gap-1">
          <Link
            href={hrefFor(locale)}
            className={cn(
              'uppercase px-2 py-1.5 rounded-md transition-colors',
              currentLocale === locale
                ? 'text-brand-magenta font-semibold'
                : 'text-brand-gray-500 hover:text-brand-gray-900'
            )}
          >
            {locale}
          </Link>
          {idx < locales.length - 1 && (
            <span className="text-brand-gray-500">|</span>
          )}
        </span>
      ))}
    </div>
  )
}
