export const revalidate = 60

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { getCategories, getProducts } from '@/lib/data/queries'
import { getCategoryName } from '@/lib/types'
import {
  buildCategorySlugMap,
  getCategorySlugFromMap,
} from '@/lib/data/category-map'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/products/ProductCard'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { langPrefix } from '@/lib/utils'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/produktai'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.productsPage
  return buildPageMetadata({
    lang,
    path: '/produktai',
    title: t.title,
    description: t.subtitle,
  })
}

export default async function ProductsPage({
  params,
}: PageProps<'/[lang]/produktai'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.productsPage
  const p = langPrefix(lang)
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ])
  const categorySlugMap = buildCategorySlugMap(categories)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
        { name: dict.nav.products, url: buildCanonicalUrl(lang, '/produktai') },
      ])} />

      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${p || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.common.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            {dict.nav.products}
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="pt-5 pb-8 lg:pt-8 lg:pb-12 bg-white">
        <Container>
          <div className="max-w-[720px]">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-2 lg:mb-3">
              {t.badge}
            </span>
            <h1 className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.title}
            </h1>
            <p className="text-[1.05rem] text-brand-gray-500 leading-[1.7]">
              {t.subtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Kategorijų juosta + produktai */}
      <section className="py-10 lg:py-14 bg-brand-gray-50">
        <Container>
          <div className="flex flex-wrap gap-3 mb-10">
            <span className="px-5 py-2 rounded-full bg-brand-gray-900 text-white text-sm font-medium">
              {t.allCategories}
            </span>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`${p}/produktai/${category.slug}`}
                className="px-5 py-2 rounded-full bg-white text-brand-gray-900 text-sm font-medium border border-[#E0E0E0] hover:bg-brand-gray-900 hover:text-white hover:border-brand-gray-900 transition-colors"
              >
                {getCategoryName(category, lang)}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                categorySlug={getCategorySlugFromMap(
                  categorySlugMap,
                  product.category_id
                )}
                dict={dict}
                priority={i < 4}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.ctaBadge}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-[1.05rem] text-brand-gray-500 mb-8 max-w-[620px] mx-auto leading-[1.7]">
            {t.ctaDesc}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`${p}/salonams`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {t.ctaPrimary}
            </Link>
            <Link
              href={`${p}/kontaktai`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.1rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
