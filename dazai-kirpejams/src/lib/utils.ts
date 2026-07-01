export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Grąžina URL prefiksą pagal kalbą.
 * Lietuvių kalba (default) — be prefikso, kitos — su prefiksu.
 */
export function langPrefix(lang: string): string {
  return lang === 'lt' ? '' : `/${lang}`
}

/**
 * Kainos formatas pagal kalbą su € prefiksu (svetainės vizualinis stilius):
 * LT/RU — kablelis (€7,90), EN — taškas (€7.90). Audito radinys SEO-9:
 * EN puslapiuose maišėsi „From €7.90" (žodynas) ir „€7,90" (komponentai).
 */
export function formatEurByLang(
  value: number,
  lang: string,
  decimals: number = 2
): string {
  const s = value.toFixed(decimals)
  return '€' + (lang === 'en' ? s : s.replace('.', ','))
}

export function formatPrice(amount: number, locale: string = 'lt'): string {
  const localeMap: Record<string, string> = {
    lt: 'lt-LT',
    en: 'en-US',
    ru: 'ru-RU',
  }

  return new Intl.NumberFormat(localeMap[locale] || 'lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
