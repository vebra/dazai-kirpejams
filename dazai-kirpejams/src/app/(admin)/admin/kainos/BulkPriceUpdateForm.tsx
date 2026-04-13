'use client'

import { useActionState, useRef, useEffect } from 'react'
import {
  bulkUpdatePricesAction,
  type BulkPriceUpdateState,
} from './actions'

const initialState: BulkPriceUpdateState = {}

type Category = {
  categoryId: string
  categoryNameLt: string
  count: number
}

export function BulkPriceUpdateForm({
  categories,
}: {
  categories: Category[]
}) {
  const [state, formAction, isPending] = useActionState(
    bulkUpdatePricesAction,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && state.updatedCount !== undefined && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Atnaujinta {state.updatedCount}{' '}
          {state.updatedCount === 1 ? 'produktas' : 'produktai'}
        </div>
      )}

      <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[12px]">
        ⚠ Šis veiksmas negrįžtamas — kainos bus pakeistos iš karto. Prieš
        vykdant rekomenduojama padaryti eksportą arba testuoti su viena
        kategorija.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="category_id"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Kategorija
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue=""
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          >
            <option value="">Visi aktyvūs produktai ({totalProducts})</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryNameLt} ({c.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="field"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Kainos tipas
          </label>
          <select
            id="field"
            name="field"
            required
            defaultValue="price_cents"
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          >
            <option value="price_cents">Pardavimo kaina (su PVM)</option>
            <option value="b2b_price_cents">B2B kaina</option>
            <option value="cost_price_cents">Savikaina</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="operation"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Operacija
          </label>
          <select
            id="operation"
            name="operation"
            required
            defaultValue="increase_pct"
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          >
            <option value="increase_pct">Padidinti (%)</option>
            <option value="decrease_pct">Sumažinti (%)</option>
            <option value="set_fixed">Nustatyti fiksuotą (€)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="value"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Reikšmė
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="value"
            name="value"
            required
            placeholder="5"
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            Procentams: 5 = 5% · Fiksuotai: 19.90 = €19.90
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Atnaujinama…' : 'Vykdyti atnaujinimą'}
        </button>
      </div>
    </form>
  )
}
