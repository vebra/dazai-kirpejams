import type { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/i18n/config'
import { SITE_URL } from '@/lib/seo'
import { getCategories, getProducts, getBlogPosts } from '@/lib/data/queries'

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
  lastModified: Date | undefined,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number
): MetadataRoute.Sitemap {
  const alternates = buildAlternates(path)
  return locales.map((loc) => ({
    url: locUrl(loc, path),
    ...(lastModified && { lastModified }),
    changeFrequency,
    priority,
    alternates,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Statiniai puslapiai — po 3 entries kiekvienam (LT/EN/RU)
  // Nenaudojam `new Date()` — build timestamp neturi SEO vertės.
  // Paliekam lastModified undefined — Google ignoruos, bet nesugadins.
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(
    ({ path, priority, changeFrequency }) =>
      expandLocales(path, undefined, changeFrequency, priority)
  )

  // 2. Kategorijų puslapiai — naudojam naujausio kategorijos produkto datą
  const categories = await getCategories()
  const products = await getProducts()

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const catProducts = products.filter((p) => p.category_id === cat.id)
    const latestDate = catProducts.reduce<Date | undefined>((latest, p) => {
      const d = p.updated_at ? new Date(p.updated_at) : undefined
      if (!d) return latest
      return !latest || d > latest ? d : latest
    }, undefined)
    return expandLocales(`/produktai/${cat.slug}`, latestDate, 'weekly', 0.8)
  })

  // 3. Produktų puslapiai (naudojam jau gautus products iš #2)
  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) => {
    const category = categories.find((c) => c.id === product.category_id)
    const categorySlug = category?.slug || 'produktai'
    const path = `/produktai/${categorySlug}/${product.slug}`
    const lastMod = product.updated_at ? new Date(product.updated_at) : undefined
    return expandLocales(path, lastMod, 'weekly', 0.7)
  })

  // 4. Blogo straipsnių puslapiai
  const blogPosts = await getBlogPosts()
  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) => {
    const lastMod = post.publishedAt ? new Date(post.publishedAt) : undefined
    return expandLocales(`/blogas/${post.slug}`, lastMod, 'monthly', 0.6)
  })

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries]
}
