import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/products/ProductCard'
import { pickCardDict } from '@/components/products/card-dict'
import { ProductPricesProvider } from '@/components/products/ProductPricesProvider'
import { StaggerReveal } from '@/components/ui/StaggerReveal'
import { getProductsStatic, getCategories } from '@/lib/data/queries'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

type FeaturedProductsProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Populiariausi produktai sekcija — atkurta iš index.html:273-345
 *  - kairėje antraštė „Populiariausi / Dažniausiai užsakomi produktai"
 *  - dešinėje „Visi produktai →" outline mygtukas
 *  - grid su 4 produktų kortelėmis (featured=true iš DB)
 */
export async function FeaturedProducts({ lang, dict }: FeaturedProductsProps) {
  const [products, categories] = await Promise.all([
    getProductsStatic({ featured: true, limit: 4 }),
    getCategories(),
  ])

  if (products.length === 0) return null

  const categoryById = new Map(categories.map((c) => [c.id, c.slug]))
  const priceIds = products.map((p) => p.id)
  const cardDict = pickCardDict(dict)

  return (
    <section className="py-16 lg:py-20 bg-white">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {dict.featured.label}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              {dict.featured.title}
            </h2>
          </div>
          <Link
            href={`${langPrefix(lang)}/produktai`}
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand-magenta text-brand-magenta rounded-lg text-[0.9rem] font-semibold hover:bg-brand-magenta hover:text-white transition-all"
          >
            {dict.featured.allProducts} →
          </Link>
        </div>

        <ProductPricesProvider ids={priceIds}>
          <StaggerReveal className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 py-2 scroll-pl-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:mx-0 lg:px-0 lg:py-0 [&>*]:snap-start [&>*]:shrink-0 [&>*]:w-[62%] sm:[&>*]:w-[42%] lg:[&>*]:w-auto">
            {products.map((product) => {
              const categorySlug = categoryById.get(product.category_id) || 'dazai'
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  categorySlug={categorySlug}
                  dict={cardDict}
                />
              )
            })}
          </StaggerReveal>
        </ProductPricesProvider>
      </Container>
    </section>
  )
}
