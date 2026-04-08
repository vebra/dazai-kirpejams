import 'server-only'
import type { Locale } from './config'

const dictionaries = {
  lt: () => import('./dictionaries/lt.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  ru: () => import('./dictionaries/ru.json').then((m) => m.default),
}

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

export const getDictionary = async (locale: Locale) => dictionaries[locale]()
