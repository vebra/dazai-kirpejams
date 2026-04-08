import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/products/ProductCard'
import { getProducts, getCategories } from '@/lib/data/queries'
import type { Locale } from '@/i18n/config'

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
    getProducts({ featured: true, limit: 4 }),
    getCategories(),
  ])

  if (products.length === 0) return null

  const categoryById = new Map(categories.map((c) => [c.id, c.slug]))

  return (
    <section className="py-16 lg:py-20 bg-white">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Populiariausi
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              Dažniausiai užsakomi produktai
            </h2>
          </div>
          <Link
            href={`/${lang}/produktai`}
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand-magenta text-brand-magenta rounded-lg text-[0.9rem] font-semibold hover:bg-brand-magenta hover:text-white transition-all"
          >
            Visi produktai →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {products.map((product) => {
            const categorySlug = categoryById.get(product.category_id) || 'dazai'
            return (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                categorySlug={categorySlug}
                dict={dict}
              />
            )
          })}
        </div>
      </Container>
    </section>
  )
}
