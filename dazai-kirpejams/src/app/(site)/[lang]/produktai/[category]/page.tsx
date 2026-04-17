import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import {
  getCategoryBySlug,
  getCategories,
  getProducts,
} from '@/lib/data/queries'
import { getCategoryName, getCategoryDescription } from '@/lib/types'
import type { Product } from '@/lib/types'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/products/ProductCard'
import { isUserVerified } from '@/lib/auth/verification'
import { CategoryFiltersBar } from '@/components/products/CategoryFiltersBar'
import { JsonLd } from '@/components/seo/JsonLd'
import { itemListSchema, breadcrumbSchema } from '@/lib/schema'
import { buildCanonicalUrl, buildLanguageAlternates, SITE_URL } from '@/lib/seo'
import { locales } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import {
  DYE_CATEGORIES,
  DYE_PALETTE_TARGET_COUNT,
  getDyeCategoryKeyBySlug,
  type DyeCategoryKey,
} from '@/lib/data/dye-categories'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/produktai/[category]'>): Promise<Metadata> {
  const { lang, category: categorySlug } = await params
  if (!hasLocale(lang)) return {}

  const category = await getCategoryBySlug(categorySlug)
  if (!category) return {}

  const name = getCategoryName(category, lang)
  const description = getCategoryDescription(category, lang)
  const path = `/produktai/${categorySlug}`
  const canonical = buildCanonicalUrl(lang, path)

  return {
    title: name,
    description: description || undefined,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title: name,
      description: description || undefined,
      url: canonical,
    },
  }
}

export async function generateStaticParams() {
  const categories = await getCategories()
  const params: { lang: string; category: string }[] = []
  for (const lang of locales) {
    for (const cat of categories) {
      params.push({ lang, category: cat.slug })
    }
  }
  return params
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<'/[lang]/produktai/[category]'>) {
  const { lang, category: categorySlug } = await params
  if (!hasLocale(lang)) notFound()

  const category = await getCategoryBySlug(categorySlug)
  if (!category) notFound()

  const isDazai = categorySlug === 'dazai'
  const showColorFilters = isDazai

  const sp = await searchParams
  const tone = typeof sp.tone === 'string' ? sp.tone : undefined
  const groupParam = typeof sp.group === 'string' ? sp.group : undefined
  // HTML dizaine default sort dažams = „Pagal numerį" (žr. category.html:104).
  // Kitoms kategorijoms — populiariausi.
  const defaultSort = isDazai ? 'number' : 'popular'
  const sortBy = typeof sp.sort === 'string' ? sp.sort : defaultSort

  const dict = await getDictionary(lang)
  const verified = await isUserVerified()
  const products = await getProducts({
    categorySlug,
    colorTone: tone,
    sortBy: sortBy as
      | 'popular'
      | 'newest'
      | 'price-asc'
      | 'price-desc'
      | 'number'
      | 'name',
  })

  const listJsonLd = itemListSchema(products, categorySlug, lang)

  const categoryName = getCategoryName(category, lang)
  const categoryDescription = getCategoryDescription(category, lang)

  const minPrice = products.length
    ? Math.min(...products.map((p) => p.price_cents / 100))
    : 7.9

  // Grupavimas pagal HTML Color SHOCK kategorijas (Natural, Ash, …) —
  // atitinka originalų category.html išdėstymą.
  const groupedByDyeCategory = new Map<DyeCategoryKey, Product[]>()
  if (showColorFilters) {
    for (const p of products) {
      const key = getDyeCategoryKeyBySlug(p.slug)
      if (!key) continue
      const bucket = groupedByDyeCategory.get(key) ?? []
      bucket.push(p)
      groupedByDyeCategory.set(key, bucket)
    }
  }

  // Filtravimas pagal URL ?group=natural — jeigu pasirinkta konkreti grupė,
  // rodome tik ją. Kiti grupės blokai paslepiami.
  const activeGroupKey = showColorFilters
    ? (DYE_CATEGORIES.find((c) => c.key === groupParam)?.key ?? null)
    : null

  // Filtro dropdown'ui — visos grupės su skaičiais (visada iš pilno sąrašo,
  // kad skaičiai neperšokdintų keičiant filtrą).
  const groupOptions = showColorFilters
    ? DYE_CATEGORIES.map((c) => ({
        value: c.key,
        label: `${c.label} (${c.slugs.length})`,
      }))
    : undefined

  const visibleCount = activeGroupKey
    ? (groupedByDyeCategory.get(activeGroupKey)?.length ?? 0)
    : products.length

  return (
    <>
      <JsonLd data={listJsonLd} />
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
        { name: dict.nav.products, url: buildCanonicalUrl(lang, '/produktai') },
        { name: categoryName, url: buildCanonicalUrl(lang, `/produktai/${categorySlug}`) },
      ])} />

      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.common.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <Link
            href={`${langPrefix(lang)}/produktai`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.nav.products}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            {categoryName}
          </span>
        </Container>
      </section>

      {/* Category Hero */}
      <section className="pt-5 pb-6 lg:pt-8 lg:pb-10 bg-white">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-2 lg:mb-3">
            Color SHOCK • RosaNera Cosmetics
          </span>
          <h1 className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-brand-gray-900 mb-2 lg:mb-3 leading-tight">
            {isDazai ? dict.categoryPage.dyeTitle : categoryName}
          </h1>
          <p className="max-w-[650px] text-brand-gray-500 text-[0.9rem] lg:text-base leading-[1.7] mb-6">
            {isDazai ? (
              <>
                {dict.categoryPage.dyeDesc}{' '}
                <strong className="text-brand-gray-900">{dict.categoryPage.dyeDescBold}</strong>{' '}
                {dict.categoryPage.dyeDescEnd}
              </>
            ) : (
              categoryDescription
            )}
          </p>

          <div className="flex flex-wrap gap-2 lg:gap-8 mt-3 lg:mt-0">
            <div className="inline-flex items-center gap-1.5 text-[0.85rem] lg:text-[0.95rem] text-brand-gray-500 px-3.5 lg:px-5 py-1.5 lg:py-2 bg-brand-gray-50 rounded-full">
              <strong className="text-brand-magenta font-bold">
                {showColorFilters ? DYE_PALETTE_TARGET_COUNT : products.length}
              </strong>{' '}
              {showColorFilters ? dict.categoryPage.colorsLabel : dict.categoryPage.productsLabel}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[0.85rem] lg:text-[0.95rem] text-brand-gray-500 px-3.5 lg:px-5 py-1.5 lg:py-2 bg-brand-gray-50 rounded-full">
              <strong className="text-brand-magenta font-bold">180 ml</strong>{' '}
              {dict.categoryPage.volumeLabel}
            </div>
            {verified && (
              <div className="inline-flex items-center gap-1.5 text-[0.85rem] lg:text-[0.95rem] text-brand-gray-500 px-3.5 lg:px-5 py-1.5 lg:py-2 bg-brand-gray-50 rounded-full">
                <strong className="text-brand-magenta font-bold">
                  Nuo €{minPrice.toFixed(2)}
                </strong>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Filters — select dropdowns kaip originaliame HTML */}
      <section className="py-5 bg-white border-t border-b border-[#E0E0E0] sticky top-[72px] z-[40]">
        <Container>
          <CategoryFiltersBar
            showGroupFilter={showColorFilters}
            totalCount={visibleCount}
            allGroupsCount={DYE_PALETTE_TARGET_COUNT}
            groupOptions={groupOptions}
            defaultSort={defaultSort}
          />
        </Container>
      </section>

      {/* Products */}
      <section className="py-10 lg:py-14 bg-brand-gray-50">
        <Container>
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-brand-gray-500">
                {dict.categoryPage.noProducts}
              </p>
            </div>
          ) : showColorFilters ? (
            <div className="space-y-12">
              {DYE_CATEGORIES.map((cat) => {
                if (activeGroupKey && activeGroupKey !== cat.key) return null
                const items = groupedByDyeCategory.get(cat.key)
                if (!items || items.length === 0) return null
                return (
                  <div key={cat.key}>
                    <h2 className="flex items-center gap-3 text-[1.3rem] font-bold text-brand-gray-900 mb-5 pb-3 border-b-2 border-[#E0E0E0]">
                      <span
                        className="inline-block w-6 h-6 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                        style={{
                          background:
                            cat.bulletGradient ?? cat.bullet,
                        }}
                        aria-hidden
                      />
                      {cat.label}
                      <span className="text-[0.85rem] font-medium text-brand-gray-500 ml-auto">
                        {items.length} {dict.categoryPage.colorsAbbrev}
                      </span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
                      {items.map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          lang={lang}
                          categorySlug={categorySlug}
                          dict={dict}
                          isVerified={verified}
                          priority={i < 4}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  categorySlug={categorySlug}
                  dict={dict}
                  isVerified={verified}
                  priority={i < 4}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Advantage bar */}
      <section className="py-10 bg-brand-gray-900 text-white">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <strong className="block text-brand-magenta text-[1.2rem] font-extrabold mb-1">
                {isDazai ? DYE_PALETTE_TARGET_COUNT : products.length}{' '}
                {isDazai ? dict.categoryPage.colorsLabel : dict.categoryPage.productsLabel}
              </strong>
              <span className="text-[0.85rem] text-white/60">
                {dict.categoryPage.advPalette}
              </span>
            </div>
            <div>
              <strong className="block text-brand-magenta text-[1.2rem] font-extrabold mb-1">
                180 ml
              </strong>
              <span className="text-[0.85rem] text-white/60">
                {dict.categoryPage.advPerPackage}
              </span>
            </div>
            <div>
              <strong className="block text-brand-magenta text-[1.2rem] font-extrabold mb-1">
                {verified ? `Nuo €${minPrice.toFixed(2)}` : dict.categoryPage.advVerifiedOnly}
              </strong>
              <span className="text-[0.85rem] text-white/60">
                {verified ? dict.categoryPage.advPerUnit : dict.categoryPage.advProfessionals}
              </span>
            </div>
            <div>
              <strong className="block text-brand-magenta text-[1.2rem] font-extrabold mb-1">
                Argan &amp; Jojoba
              </strong>
              <span className="text-[0.85rem] text-white/60">
                {dict.categoryPage.advOils}
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {dict.categoryPage.ctaBadge}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
            {dict.categoryPage.ctaTitle}
          </h2>
          <p className="text-[1.05rem] text-brand-gray-500 mb-8 max-w-[620px] mx-auto leading-[1.7]">
            {dict.categoryPage.ctaDesc}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`${langPrefix(lang)}/salonams`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {dict.categoryPage.ctaPrimary}
            </Link>
            <Link
              href={`${langPrefix(lang)}/kontaktai`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.1rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
            >
              {dict.categoryPage.ctaSecondary}
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
