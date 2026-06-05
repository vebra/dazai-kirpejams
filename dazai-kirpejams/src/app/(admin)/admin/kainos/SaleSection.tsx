'use client'

import { useState, useMemo, useActionState } from 'react'
import { saleAction, type SaleActionState } from './actions'
import type { AdminProductListRow } from '@/lib/admin/queries'

type CategoryOption = {
  categoryId: string
  categoryNameLt: string
  count: number
}

const initialState: SaleActionState = {}

const EUR = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

function fmt(cents: number): string {
  return EUR.format(cents / 100)
}

export function SaleSection({
  categories,
  products,
}: {
  categories: CategoryOption[]
  products: AdminProductListRow[]
}) {
  const [state, formAction, isPending] = useActionState(saleAction, initialState)
  const [scope, setScope] = useState<'all' | 'category' | 'products'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.nameLt.toLowerCase().includes(q) ||
        (p.colorNumber ?? '').toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)
    )
  }, [products, search])

  const onSaleCount = products.filter((p) => p.salePriceCents != null).length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ {state.message ?? 'Atlikta.'}
        </div>
      )}

      <div className="text-[13px] text-brand-gray-500">
        Šiuo metu su akcija:{' '}
        <strong className="text-brand-gray-900">{onSaleCount}</strong> prek(ės).
      </div>

      {/* Apimtis */}
      <div>
        <div className="text-[12px] font-semibold text-brand-gray-900 mb-2">
          Kam taikyti
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Visoms prekėms'],
              ['category', 'Kategorijai'],
              ['products', 'Išrinktoms prekėms'],
            ] as const
          ).map(([val, label]) => (
            <label
              key={val}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-colors ${
                scope === val
                  ? 'bg-brand-magenta text-white border-brand-magenta'
                  : 'bg-white text-brand-gray-900 border-[#ddd] hover:border-brand-magenta'
              }`}
            >
              <input
                type="radio"
                name="scope"
                value={val}
                checked={scope === val}
                onChange={() => setScope(val)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Kategorija */}
      {scope === 'category' && (
        <div>
          <label
            htmlFor="sale_category_id"
            className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
          >
            Kategorija
          </label>
          <select
            id="sale_category_id"
            name="category_id"
            defaultValue=""
            className="w-full md:w-80 px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          >
            <option value="" disabled>
              — Pasirinkite —
            </option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryNameLt} ({c.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Prekių parinkiklis */}
      {scope === 'products' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ieškoti pagal pavadinimą, numerį, SKU…"
              className="flex-1 px-3.5 py-2 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
            <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">
              Pažymėta: {selected.size}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-brand-gray-500">
                Nieko nerasta.
              </div>
            ) : (
              filtered.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[#F9F9FB] cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="w-4 h-4 accent-brand-magenta"
                  />
                  <span className="flex-1 text-brand-gray-900">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameLt}
                  </span>
                  <span className="text-brand-gray-500 text-[12px]">
                    {fmt(p.priceCents)}
                  </span>
                  {p.salePriceCents != null && (
                    <span className="text-brand-magenta text-[12px] font-semibold">
                      akcija {fmt(p.salePriceCents)}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
          {/* Pažymėtų ID — paslėpti inputai formai */}
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="product_ids" value={id} />
          ))}
        </div>
      )}

      {/* Nuolaidos dydis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div>
          <label
            htmlFor="sale_discount_type"
            className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
          >
            Nuolaidos tipas
          </label>
          <select
            id="sale_discount_type"
            name="discount_type"
            defaultValue="percent"
            className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          >
            <option value="percent">Procentas (%)</option>
            <option value="fixed">Suma (€)</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="sale_value"
            className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
          >
            Dydis
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="sale_value"
            name="value"
            placeholder="20"
            className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          name="intent"
          value="apply"
          disabled={isPending}
          className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Vykdoma…' : 'Uždėti akciją'}
        </button>
        <button
          type="submit"
          name="intent"
          value="remove"
          disabled={isPending}
          className="px-5 py-2.5 bg-white border border-[#ddd] text-red-700 rounded-lg font-semibold text-sm hover:bg-red-50 hover:border-red-300 disabled:opacity-60 transition-colors"
        >
          Nuimti akciją
        </button>
      </div>
    </form>
  )
}
