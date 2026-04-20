'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Option = { value: string; label: string }

export type CategoryFiltersLabels = {
  categoryLabel: string
  sortLabel: string
  allColors: string
  showingCount: string
  sortByNumber: string
  sortByName: string
  sortByPopular: string
}

type Props = {
  showGroupFilter?: boolean
  totalCount: number
  allGroupsCount: number
  groupOptions?: Option[]
  defaultSort?: string
  labels: CategoryFiltersLabels
}

export function CategoryFiltersBar({
  showGroupFilter,
  totalCount,
  allGroupsCount,
  groupOptions,
  defaultSort = 'popular',
  labels,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentGroup = searchParams.get('group') || 'all'
  const currentSort = searchParams.get('sort') || defaultSort

  const sortOptions: Option[] = [
    { value: 'number', label: labels.sortByNumber },
    { value: 'name', label: labels.sortByName },
    { value: 'popular', label: labels.sortByPopular },
  ]

  function updateParam(key: string, value: string, fallback?: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all' || value === fallback) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      {showGroupFilter && groupOptions && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="filterCategory"
            className="text-[0.85rem] font-semibold text-brand-gray-900"
          >
            {labels.categoryLabel}
          </label>
          <select
            id="filterCategory"
            value={currentGroup}
            onChange={(e) => updateParam('group', e.target.value)}
            className="px-4 py-2 border border-[#E0E0E0] rounded-md font-[inherit] text-[0.9rem] bg-white cursor-pointer text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
          >
            <option value="all">{labels.allColors} ({allGroupsCount})</option>
            {groupOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label
          htmlFor="filterSort"
          className="text-[0.85rem] font-semibold text-brand-gray-900"
        >
          {labels.sortLabel}
        </label>
        <select
          id="filterSort"
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value, defaultSort)}
          className="px-4 py-2 border border-[#E0E0E0] rounded-md font-[inherit] text-[0.9rem] bg-white cursor-pointer text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:ml-auto text-[0.85rem] text-brand-gray-500">
        {labels.showingCount.replace('{count}', String(totalCount))}
      </div>
    </div>
  )
}
