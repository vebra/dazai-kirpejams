export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import {
  getCategoryBySlug,
  getCategories,
  getProducts,
} from '@/lib/data/queries'
import { getCategoryName, getCategoryDescription } from '@/lib/types'
import { Container } from '@/components/ui/Container'
import { CategoryProductsView } from '@/components/products/CategoryProductsView'
import { JsonLd } from '@/components/seo/JsonLd'
import { itemListSchema, breadcrumbSchema } from '@/lib/schema'
import { buildCanonicalUrl, buildLanguageAlternates } from '@/lib/seo'
import { locales } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { DYE_PALETTE_TARGET_COUNT } from '@/lib/data/dye-categories'

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
  const dict = await getDictionary(lang)
  const c = dict.common

  const title = `${name} ${c.seoCategoryAudienceSuffix} | ${c.seoBrandSuffix}`

  return {
    title,
    description: description || undefined,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title,
      description: description || undefined,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || undefined,
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
}: PageProps<'/[lang]/produktai/[category]'>) {
  const { lang, category: categorySlug } = await params
  if (!hasLocale(lang)) notFound()

  const category = await getCategoryBySlug(categorySlug)
  if (!category) notFound()

  const isDazai = categorySlug === 'dazai'

  const dict = await getDictionary(lang)
  // Serveryje visada gauname visus produktus su numatytu rikiavimo būdu —
  // filtravimas ir rūšiavimas pagal URL parametrus vyksta kliento pusėje
  // (CategoryProductsView), kad puslapis būtų statiškai generuojamas (ISR).
  const defaultSort = isDazai ? 'number' : 'popular'
  const products = await getProducts({
    categorySlug,
    sortBy: defaultSort as 'popular' | 'number',
  })

  const listJsonLd = itemListSchema(products, categorySlug, lang)

  const categoryName = getCategoryName(category, lang)
  const categoryDescription = getCategoryDescription(category, lang)

  const minPrice = products.length
    ? Math.min(...products.map((p) => p.price_cents / 100))
    : 7.9

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
                {isDazai ? DYE_PALETTE_TARGET_COUNT : products.length}
              </strong>{' '}
              {isDazai ? dict.categoryPage.colorsLabel : dict.categoryPage.productsLabel}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[0.85rem] lg:text-[0.95rem] text-brand-gray-500 px-3.5 lg:px-5 py-1.5 lg:py-2 bg-brand-gray-50 rounded-full">
              <strong className="text-brand-magenta font-bold">180 ml</strong>{' '}
              {dict.categoryPage.volumeLabel}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[0.85rem] lg:text-[0.95rem] text-brand-gray-500 px-3.5 lg:px-5 py-1.5 lg:py-2 bg-brand-gray-50 rounded-full">
              <strong className="text-brand-magenta font-bold">
                Nuo €{minPrice.toFixed(2)}
              </strong>
            </div>
          </div>
        </Container>
      </section>

      {/* Filtrai + Produktai — kliento komponentas, kad serveris galėtų
          statiškai sugeneruoti puslapį (ISR) be searchParams priklausomybės */}
      <Suspense>
        <CategoryProductsView
          products={products}
          lang={lang}
          categorySlug={categorySlug}
          isDazai={isDazai}
          dict={dict}
        />
      </Suspense>

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
                Nuo €{minPrice.toFixed(2)}
              </strong>
              <span className="text-[0.85rem] text-white/60">
                {dict.categoryPage.advPerUnit}
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
