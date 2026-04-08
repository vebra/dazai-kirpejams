'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Option = { value: string; label: string }

type Props = {
  /** Ar rodyti „Kategorija" dropdown'ą (tik dažams) */
  showGroupFilter?: boolean
  /** Kiek produktų šiuo metu matoma (po filtro) — rodoma dešinėje „Rodomi: N" */
  totalCount: number
  /** „Visos spalvos (N)" skaičius — HTML dizaine tai 50 (target kiekis), nes HTML hardcode'ina 50. */
  allGroupsCount: number
  /** Kategorijos opcijos su skaičiais, pvz. „Natural (9)". HTML eilės tvarka. */
  groupOptions?: Option[]
  /** Pradinis rūšiavimas, jeigu URL nenustatytas. Dažams — 'number', kitoms 'popular'. */
  defaultSort?: string
}

const SORT_OPTIONS: Option[] = [
  { value: 'number', label: 'Pagal numerį' },
  { value: 'name', label: 'Pagal pavadinimą' },
  { value: 'popular', label: 'Populiariausi' },
]

export function CategoryFiltersBar({
  showGroupFilter,
  totalCount,
  allGroupsCount,
  groupOptions,
  defaultSort = 'popular',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentGroup = searchParams.get('group') || 'all'
  const currentSort = searchParams.get('sort') || defaultSort

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
    <div className="flex flex-wrap items-center gap-6">
      {showGroupFilter && groupOptions && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="filterCategory"
            className="text-[0.85rem] font-semibold text-brand-gray-900"
          >
            Kategorija:
          </label>
          <select
            id="filterCategory"
            value={currentGroup}
            onChange={(e) => updateParam('group', e.target.value)}
            className="px-4 py-2 border border-[#E0E0E0] rounded-md font-[inherit] text-[0.9rem] bg-white cursor-pointer text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
          >
            <option value="all">Visos spalvos ({allGroupsCount})</option>
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
          Rūšiuoti:
        </label>
        <select
          id="filterSort"
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value, defaultSort)}
          className="px-4 py-2 border border-[#E0E0E0] rounded-md font-[inherit] text-[0.9rem] bg-white cursor-pointer text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto text-[0.85rem] text-brand-gray-500">
        Rodomi: {totalCount} produktai
      </div>
    </div>
  )
}
