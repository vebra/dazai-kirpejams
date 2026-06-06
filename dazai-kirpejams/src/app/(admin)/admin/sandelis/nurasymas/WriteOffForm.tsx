'use client'

import { useState, useMemo, useActionState } from 'react'
import { writeOffStockAction, type WriteOffState } from '../actions'
import type { AdminProductListRow } from '@/lib/admin/queries'

const initialState: WriteOffState = {}

const CATEGORIES = [
  'Brokas',
  'Pavyzdžiai salonui',
  'Rankinis išvežimas',
  'Inventorizacijos korekcija',
  'Kita',
]

export function WriteOffForm({ products }: { products: AdminProductListRow[] }) {
  const [state, formAction, isPending] = useActionState(
    writeOffStockAction,
    initialState
  )
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminProductListRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products.slice(0, 30)
    return products
      .filter(
        (p) =>
          p.nameLt.toLowerCase().includes(q) ||
          (p.colorNumber ?? '').toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [products, search])

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ {state.message}
        </div>
      )}

      {/* Prekė */}
      <div>
        <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
          Prekė
        </label>
        {selected ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F9F9FB] border border-[#ddd] rounded-lg">
            <div>
              <div className="font-medium text-brand-gray-900">
                {selected.colorNumber ? `${selected.colorNumber} · ` : ''}
                {selected.nameLt}
              </div>
              <div className="text-[12px] text-brand-gray-500">
                Dabar likutis: <strong>{selected.stockQuantity}</strong>
                {selected.sku ? ` · ${selected.sku}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[12px] text-brand-gray-500 hover:text-brand-gray-900 underline"
            >
              Keisti
            </button>
            <input type="hidden" name="product_id" value={selected.id} />
          </div>
        ) : (
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ieškoti pagal pavadinimą, numerį, SKU…"
              className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
            <div className="mt-2 max-h-60 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
              {filtered.length === 0 ? (
                <div className="px-4 py-5 text-center text-sm text-brand-gray-500">
                  Nieko nerasta.
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left"
                  >
                    <span className="text-brand-gray-900">
                      {p.colorNumber ? `${p.colorNumber} · ` : ''}
                      {p.nameLt}
                    </span>
                    <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">
                      likutis {p.stockQuantity}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="qty"
            className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
          >
            Kiekis nurašyti
          </label>
          <input
            type="text"
            inputMode="numeric"
            id="qty"
            name="qty"
            placeholder="1"
            className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          />
        </div>
        <div>
          <label
            htmlFor="category"
            className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
          >
            Priežastis
          </label>
          <select
            id="category"
            name="category"
            defaultValue="Brokas"
            className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="note"
          className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
        >
          Pastaba (neprivaloma)
        </label>
        <input
          type="text"
          id="note"
          name="note"
          maxLength={200}
          placeholder="pvz. sugadinta pakuotė, atiduota salonui X…"
          className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !selected}
        className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Nurašoma…' : 'Nurašyti'}
      </button>
    </form>
  )
}
