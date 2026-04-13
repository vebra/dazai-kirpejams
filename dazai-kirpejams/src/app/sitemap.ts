import type { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/i18n/config'
import { SITE_URL } from '@/lib/seo'
import { getCategories, getProducts } from '@/lib/data/queries'

/**
 * Statinių puslapių sąrašas — pathai BE lokalės prefikso.
 * priority: santykinė svarba (0–1), changeFrequency: numatomas pakeitimų dažnis.
 */
const STATIC_PATHS: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/produktai', priority: 0.9, changeFrequency: 'daily' },
  { path: '/spalvu-palete', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/salonams', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/skaiciuokle', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/apie-mus', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/kontaktai', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blogas', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/duk', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/pristatymas', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privatumo-politika', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/pirkimo-salygos', priority: 0.3, changeFrequency: 'yearly' },
]

/**
 * Suformuoja hreflang alternates žemėlapį vienam pathui.
 * Įtraukia visus locale'us + x-default (nukreipia į LT).
 */
function locUrl(loc: string, pathWithoutLocale: string) {
  if (loc === defaultLocale) {
    return `${SITE_URL}${pathWithoutLocale || '/'}`
  }
  return `${SITE_URL}/${loc}${pathWithoutLocale}`
}

function buildAlternates(pathWithoutLocale: string) {
  const languages: Record<string, string> = {}
  for (const loc of locales) {
    languages[loc] = locUrl(loc, pathWithoutLocale)
  }
  languages['x-default'] = locUrl(defaultLocale, pathWithoutLocale)
  return { languages }
}

/**
 * Kiekvienam pathui sugeneruoja po vieną entry PER LOKALĘ — taip Google gauna
 * atskirus URL'us su savo metadata ir bendrais hreflang alternates.
 */
function expandLocales(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number
): MetadataRoute.Sitemap {
  const alternates = buildAlternates(path)
  return locales.map((loc) => ({
    url: locUrl(loc, path),
    lastModified,
    changeFrequency,
    priority,
    alternates,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Statiniai puslapiai — po 3 entries kiekvienam (LT/EN/RU)
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(
    ({ path, priority, changeFrequency }) =>
      expandLocales(path, now, changeFrequency, priority)
  )

  // 2. Kategorijų puslapiai
  const categories = await getCategories()
  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) =>
    expandLocales(`/produktai/${cat.slug}`, now, 'weekly', 0.8)
  )

  // 3. Produktų puslapiai
  const products = await getProducts()
  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) => {
    const category = categories.find((c) => c.id === product.category_id)
    const categorySlug = category?.slug || 'produktai'
    const path = `/produktai/${categorySlug}/${product.slug}`
    const lastMod = product.updated_at ? new Date(product.updated_at) : now
    return expandLocales(path, lastMod, 'weekly', 0.7)
  })

  return [...staticEntries, ...categoryEntries, ...productEntries]
}
