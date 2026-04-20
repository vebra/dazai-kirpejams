'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

export type PaletteGridLabels = {
  searchPlaceholder: string
  filterAll: string
  filterNatural: string
  filterWarm: string
  filterCool: string
  filterLight: string
  filterMedium: string
  filterDark: string
  familyLight: string
  familyMedium: string
  familyDark: string
  viewMore: string
  noResults: string
}

type PaletteGridProps = {
  products: Product[]
  lang: Locale
  labels: PaletteGridLabels
}

type FilterValue =
  | 'all'
  | 'neutrali'
  | 'šilta'
  | 'šalta'
  | 'šviesi'
  | 'vidutinė'
  | 'tamsi'

type FilterDef = {
  value: FilterValue
  label: string
  match: (p: Product) => boolean
}

export function PaletteGrid({ products, lang, labels }: PaletteGridProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  const filters: FilterDef[] = [
    { value: 'all', label: labels.filterAll, match: () => true },
    { value: 'neutrali', label: labels.filterNatural, match: (p) => p.color_tone === 'neutrali' },
    { value: 'šilta', label: labels.filterWarm, match: (p) => p.color_tone === 'šilta' },
    { value: 'šalta', label: labels.filterCool, match: (p) => p.color_tone === 'šalta' },
    { value: 'šviesi', label: labels.filterLight, match: (p) => p.color_family === 'šviesi' },
    { value: 'vidutinė', label: labels.filterMedium, match: (p) => p.color_family === 'vidutinė' },
    { value: 'tamsi', label: labels.filterDark, match: (p) => p.color_family === 'tamsi' },
  ]

  const familyLabels: Record<string, string> = {
    'šviesi': labels.familyLight,
    'vidutinė': labels.familyMedium,
    'tamsi': labels.familyDark,
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filterDef = filters.find((f) => f.value === activeFilter) || filters[0]

    return products.filter((p) => {
      if (!filterDef.match(p)) return false
      if (!query) return true
      const num = (p.color_number || '').toLowerCase()
      const name = (p.color_name || '').toLowerCase()
      return num.includes(query) || name.includes(query)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, activeFilter])

  return (
    <>
      {/* Search */}
      <div className="relative max-w-[640px] mx-auto mb-8">
        <span
          className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gray-500 text-[1.15rem] pointer-events-none"
          aria-hidden
        >
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full pl-14 pr-5 py-[16px] border border-[#E0E0E0] rounded-full bg-brand-gray-50 text-brand-gray-900 text-[0.95rem] placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-magenta focus:bg-white focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2.5 justify-center mb-10">
        {filters.map((filter) => {
          const active = activeFilter === filter.value
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`px-5 py-2 rounded-full text-[0.85rem] font-semibold border transition-all ${
                active
                  ? 'bg-brand-magenta text-white border-brand-magenta shadow-[0_4px_16px_rgba(233,30,140,0.3)]'
                  : 'bg-white text-brand-gray-900 border-[#E0E0E0] hover:border-brand-magenta hover:text-brand-magenta'
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* Color grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-gray-500">
          {labels.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`${langPrefix(lang)}/produktai/dazai/${product.slug}`}
              className="group bg-brand-gray-50 rounded-xl p-4 text-center border border-transparent hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
            >
              <div className="relative w-[108px] h-[180px] mx-auto mb-3 overflow-hidden rounded-md bg-white border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                {product.image_urls[0] ? (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.color_name || product.name_lt}
                    fill
                    sizes="108px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: product.color_hex || '#f5f5f7' }}
                    aria-hidden
                  />
                )}
              </div>
              <div className="text-[0.75rem] font-bold text-brand-magenta uppercase tracking-wider mb-1">
                {product.color_number}
              </div>
              <div className="text-[0.88rem] font-bold text-brand-gray-900 mb-1 line-clamp-1">
                {product.color_name}
              </div>
              {product.color_family && (
                <div className="text-[0.72rem] text-brand-gray-500 mb-3">
                  {familyLabels[product.color_family] || product.color_family}
                </div>
              )}
              <span className="text-[0.78rem] font-semibold text-brand-magenta group-hover:translate-x-1 inline-block transition-transform">
                {labels.viewMore} →
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
