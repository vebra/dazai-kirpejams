'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Product } from '@/lib/types'
import { getProductName } from '@/lib/types'
import type { Locale } from '@/i18n/config'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryFiltersBar } from '@/components/products/CategoryFiltersBar'
import { ShowMoreGrid } from '@/components/products/ShowMoreGrid'
import { Container } from '@/components/ui/Container'
import {
  DYE_CATEGORIES,
  DYE_PALETTE_TARGET_COUNT,
  getDyeCategoryKeyBySlug,
  type DyeCategoryKey,
} from '@/lib/data/dye-categories'

type Props = {
  products: Product[]
  lang: Locale
  categorySlug: string
  isDazai: boolean
  dict: Record<string, any>
}

function sortProducts(products: Product[], sortBy: string, lang: Locale): Product[] {
  const sorted = [...products]
  switch (sortBy) {
    case 'number':
      return sorted.sort((a, b) => {
        const an = parseFloat(a.color_number ?? '999')
        const bn = parseFloat(b.color_number ?? '999')
        return an - bn
      })
    case 'name':
      return sorted.sort((a, b) =>
        getProductName(a, lang).localeCompare(getProductName(b, lang))
      )
    case 'price-asc':
      return sorted.sort((a, b) => a.price_cents - b.price_cents)
    case 'price-desc':
      return sorted.sort((a, b) => b.price_cents - a.price_cents)
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    case 'popular':
    default:
      return sorted
  }
}

export function CategoryProductsView({
  products,
  lang,
  categorySlug,
  isDazai,
  dict,
}: Props) {
  const searchParams = useSearchParams()
  const showColorFilters = isDazai

  const defaultSort = isDazai ? 'number' : 'popular'
  const sortBy = searchParams.get('sort') || defaultSort
  const groupParam = searchParams.get('group') || undefined

  const sortedProducts = useMemo(
    () => sortProducts(products, sortBy, lang),
    [products, sortBy, lang]
  )

  const groupedByDyeCategory = useMemo(() => {
    if (!showColorFilters) return new Map<DyeCategoryKey, Product[]>()
    const map = new Map<DyeCategoryKey, Product[]>()
    for (const p of sortedProducts) {
      const key = getDyeCategoryKeyBySlug(p.slug)
      if (!key) continue
      const bucket = map.get(key) ?? []
      bucket.push(p)
      map.set(key, bucket)
    }
    return map
  }, [sortedProducts, showColorFilters])

  const activeGroupKey = showColorFilters
    ? (DYE_CATEGORIES.find((c) => c.key === groupParam)?.key ?? null)
    : null

  const groupOptions = showColorFilters
    ? DYE_CATEGORIES.map((c) => ({
        value: c.key,
        label: `${c.label} (${c.slugs.length})`,
      }))
    : undefined

  const visibleCount = activeGroupKey
    ? (groupedByDyeCategory.get(activeGroupKey)?.length ?? 0)
    : sortedProducts.length

  return (
    <>
      {/* Filters */}
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
          {sortedProducts.length === 0 ? (
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
                          background: cat.bulletGradient ?? cat.bullet,
                        }}
                        aria-hidden
                      />
                      {cat.label}
                      <span className="text-[0.85rem] font-medium text-brand-gray-500 ml-auto">
                        {items.length} {dict.categoryPage.colorsAbbrev}
                      </span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
                      <ShowMoreGrid
                        total={items.length}
                        showMoreLabel={dict.categoryPage.showMore}
                        showingOfLabel={dict.categoryPage.showingOf}
                      >
                        {items.map((product, i) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            lang={lang}
                            categorySlug={categorySlug}
                            dict={dict}

                            priority={i < 4}
                          />
                        ))}
                      </ShowMoreGrid>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
              <ShowMoreGrid
                total={sortedProducts.length}
                showMoreLabel={dict.categoryPage.showMore}
                showingOfLabel={dict.categoryPage.showingOf}
              >
                {sortedProducts.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    lang={lang}
                    categorySlug={categorySlug}
                    dict={dict}
                    priority={i < 4}
                  />
                ))}
              </ShowMoreGrid>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
