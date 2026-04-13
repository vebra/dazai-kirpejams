'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Option = {
  value: string
  label: string
}

type ProductFiltersProps = {
  showColorFilters?: boolean
  sortLabel: string
}

const TONE_OPTIONS: Option[] = [
  { value: 'neutrali', label: 'Neutrali' },
  { value: 'šilta', label: 'Šilta' },
  { value: 'šalta', label: 'Šalta' },
]

const FAMILY_OPTIONS: Option[] = [
  { value: 'šviesi', label: 'Šviesi' },
  { value: 'vidutinė', label: 'Vidutinė' },
  { value: 'tamsi', label: 'Tamsi' },
]

const SORT_OPTIONS: Option[] = [
  { value: 'popular', label: 'Populiariausi' },
  { value: 'newest', label: 'Naujausi' },
  { value: 'price-asc', label: 'Kaina ↑' },
  { value: 'price-desc', label: 'Kaina ↓' },
]

export function ProductFilters({
  showColorFilters,
  sortLabel,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTone = searchParams.get('tone')
  const currentFamily = searchParams.get('family')
  const currentSort = searchParams.get('sort') || 'popular'

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white border border-brand-gray-50 rounded-2xl p-6 mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 sm:gap-y-4">
        {showColorFilters && (
          <>
            <FilterGroup label="Tonas">
              {TONE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  active={currentTone === opt.value}
                  onClick={() => updateParam('tone', opt.value)}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </FilterGroup>

            <FilterGroup label="Šeima">
              {FAMILY_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  active={currentFamily === opt.value}
                  onClick={() => updateParam('family', opt.value)}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </FilterGroup>
          </>
        )}

        <FilterGroup label={sortLabel} className="sm:ml-auto">
          {SORT_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={currentSort === opt.value}
              onClick={() => updateParam('sort', opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-brand-gray-500">
        {label}
      </span>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
        active
          ? 'bg-brand-magenta text-white'
          : 'bg-brand-gray-50 text-brand-gray-900 hover:bg-brand-gray-900 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}
