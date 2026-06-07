'use client'

import { useState, useMemo, useActionState } from 'react'
import { addOrderItemAction, type AddOrderItemState } from '../actions'
import type { AdminProductListRow } from '@/lib/admin/queries'

const initialState: AddOrderItemState = {}

export function AddOrderItemForm({
  orderId,
  products,
}: {
  orderId: string
  products: AdminProductListRow[]
}) {
  const [state, formAction, isPending] = useActionState(addOrderItemAction, initialState)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminProductListRow | null>(null)

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.nameLt.toLowerCase().includes(q) ||
          (p.colorNumber ?? '').toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [products, search])

  return (
    <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
        Pridėti prekę
      </h3>

      {state.error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="order_id" value={orderId} />

        {selected ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F9F9FB] border border-[#ddd] rounded-lg">
            <div>
              <div className="font-medium text-brand-gray-900">
                {selected.colorNumber ? `${selected.colorNumber} · ` : ''}
                {selected.nameLt}
              </div>
              <div className="text-[12px] text-brand-gray-500">
                Likutis: {selected.stockQuantity}
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
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ieškoti prekės (pavadinimas, numeris, SKU)…"
              className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
            {results.length > 0 && (
              <div className="mt-2 border border-[#eee] rounded-lg divide-y divide-[#f3f3f3] overflow-hidden">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelected(p)
                      setSearch('')
                    }}
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
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
          <div>
            <label htmlFor="qty" className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
              Kiekis
            </label>
            <input
              type="number"
              id="qty"
              name="qty"
              min={1}
              step={1}
              defaultValue={1}
              className="w-24 px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !selected}
            className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Pridedama…' : '➕ Pridėti į užsakymą'}
          </button>
        </div>
        <p className="text-[12px] text-brand-gray-500">
          Sumos perskaičiuojamos automatiškai, likutis sumažinamas. Jei užsakymas
          jau turi sąskaitą — sugeneruokite ją iš naujo.
        </p>
      </form>
    </section>
  )
}
