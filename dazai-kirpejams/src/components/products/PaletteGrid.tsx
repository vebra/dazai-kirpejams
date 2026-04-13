'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

type PaletteGridProps = {
  products: Product[]
  lang: Locale
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

const FILTERS: FilterDef[] = [
  { value: 'all', label: 'Visi', match: () => true },
  {
    value: 'neutrali',
    label: 'Natūralūs',
    match: (p) => p.color_tone === 'neutrali',
  },
  { value: 'šilta', label: 'Šilti', match: (p) => p.color_tone === 'šilta' },
  { value: 'šalta', label: 'Šalti', match: (p) => p.color_tone === 'šalta' },
  {
    value: 'šviesi',
    label: 'Šviesūs',
    match: (p) => p.color_family === 'šviesi',
  },
  {
    value: 'vidutinė',
    label: 'Vidutiniai',
    match: (p) => p.color_family === 'vidutinė',
  },
  { value: 'tamsi', label: 'Tamsūs', match: (p) => p.color_family === 'tamsi' },
]

const FAMILY_LABELS: Record<string, string> = {
  'šviesi': 'Šviesūs',
  'vidutinė': 'Vidutiniai',
  'tamsi': 'Tamsūs',
}

export function PaletteGrid({ products, lang }: PaletteGridProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filterDef = FILTERS.find((f) => f.value === activeFilter) || FILTERS[0]

    return products.filter((p) => {
      if (!filterDef.match(p)) return false
      if (!query) return true
      const num = (p.color_number || '').toLowerCase()
      const name = (p.color_name || '').toLowerCase()
      return num.includes(query) || name.includes(query)
    })
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
          placeholder="Ieškoti pagal spalvos numerį arba pavadinimą..."
          className="w-full pl-14 pr-5 py-[16px] border border-[#E0E0E0] rounded-full bg-brand-gray-50 text-brand-gray-900 text-[0.95rem] placeholder:text-brand-gray-500 focus:outline-none focus:border-brand-magenta focus:bg-white focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2.5 justify-center mb-10">
        {FILTERS.map((filter) => {
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
          Nerasta jokių atspalvių pagal Jūsų paiešką. Pabandykite kitą užklausą.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`${langPrefix(lang)}/produktai/dazai/${product.slug}`}
              className="group bg-brand-gray-50 rounded-xl p-5 text-center border border-transparent hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
            >
              <div
                className="w-20 h-20 mx-auto rounded-full mb-4 border border-[#E0E0E0] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]"
                style={{
                  backgroundColor: product.color_hex || '#f5f5f7',
                }}
                aria-hidden
              />
              <div className="text-[0.75rem] font-bold text-brand-magenta uppercase tracking-wider mb-1">
                {product.color_number}
              </div>
              <div className="text-[0.88rem] font-bold text-brand-gray-900 mb-1 line-clamp-1">
                {product.color_name}
              </div>
              {product.color_family && (
                <div className="text-[0.72rem] text-brand-gray-500 mb-3">
                  {FAMILY_LABELS[product.color_family] || product.color_family}
                </div>
              )}
              <span className="text-[0.78rem] font-semibold text-brand-magenta group-hover:translate-x-1 inline-block transition-transform">
                Peržiūrėti →
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
