export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
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
