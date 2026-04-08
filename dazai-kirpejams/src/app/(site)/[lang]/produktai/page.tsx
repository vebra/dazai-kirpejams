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
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { ProductCard } from '@/components/products/ProductCard'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/produktai'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/produktai',
    title: dict.nav.allProducts,
    description: dict.meta.description,
  })
}

export default async function ProductsPage({
  params,
}: PageProps<'/[lang]/produktai'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const categories = await getCategories()
  const products = await getProducts()
  const categorySlugMap = buildCategorySlugMap(categories)

  return (
    <>
      <PageHeader
        eyebrow="180 ml"
        title={dict.nav.allProducts}
        description={dict.meta.description}
      />

      <Section background="white">
        <Container>
          {/* Kategorijų juosta */}
          <div className="flex flex-wrap gap-3 mb-12">
            <span className="px-5 py-2 rounded-full bg-brand-gray-900 text-white text-sm font-medium">
              {dict.nav.allProducts}
            </span>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${lang}/produktai/${category.slug}`}
                className="px-5 py-2 rounded-full bg-brand-gray-50 text-brand-gray-900 text-sm font-medium hover:bg-brand-gray-900 hover:text-white transition-colors"
              >
                {getCategoryName(category, lang)}
              </Link>
            ))}
          </div>

          {/* Produktų tinklelis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                categorySlug={getCategorySlugFromMap(
                  categorySlugMap,
                  product.category_id
                )}
                dict={dict}
              />
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
