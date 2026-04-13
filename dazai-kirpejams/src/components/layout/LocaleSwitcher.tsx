import Link from 'next/link'
import { locales, type Locale } from '@/i18n/config'
import { cn, langPrefix } from '@/lib/utils'

type LocaleSwitcherProps = {
  currentLocale: Locale
  variant?: 'header' | 'mobile'
}

export function LocaleSwitcher({
  currentLocale,
  variant = 'header',
}: LocaleSwitcherProps) {
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
            href={langPrefix(locale) || '/'}
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
