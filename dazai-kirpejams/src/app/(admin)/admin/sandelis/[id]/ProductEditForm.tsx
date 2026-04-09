'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateProductAction, type UpdateProductState } from '../actions'
import type { AdminProductDetail } from '@/lib/admin/queries'

const initialState: UpdateProductState = {}

/**
 * Formatuoja cent'us į EUR formatą su tašku (įvesties laukui) — grąžina
 * pvz. "18.50" iš 1850. Tuščia reikšmė jei cent'ai `null`.
 */
function centsToEurInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2)
}

/**
 * Maržos rodiklis — skaičiuojam pagal retail su PVM, cost be PVM.
 * Formulė: (retail_excl_vat - cost) / retail_excl_vat × 100
 * LT PVM = 21%, todėl retail_excl_vat = retail / 1.21
 */
function MarginDisplay({
  priceCents,
  costPriceCents,
}: {
  priceCents: number
  costPriceCents: number | null
}) {
  if (costPriceCents === null || costPriceCents === 0) {
    return (
      <div className="bg-[#F5F5F7] border border-[#eee] rounded-lg p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Marža
        </div>
        <div className="mt-1 text-sm text-brand-gray-500">
          Nurodykite savikainą, kad matytumėte maržą
        </div>
      </div>
    )
  }

  const retailExclVatCents = Math.round(priceCents / 1.21)
  const grossProfitCents = retailExclVatCents - costPriceCents
  const marginPct = (grossProfitCents / retailExclVatCents) * 100
  const markupMultiple = priceCents / costPriceCents

  const color =
    marginPct >= 60
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : marginPct >= 30
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-red-700 bg-red-50 border-red-200'

  return (
    <div className={`border rounded-lg p-4 ${color}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] opacity-80">
        Marža
      </div>
      <div className="mt-1 text-xl font-bold">{marginPct.toFixed(1)}%</div>
      <div className="text-[12px] mt-1 opacity-80">
        Pelnas: €{(grossProfitCents / 100).toFixed(2)} / vnt. · Antkainis ×
        {markupMultiple.toFixed(2)}
      </div>
    </div>
  )
}

type Props = {
  product: AdminProductDetail
}

export function ProductEditForm({ product }: Props) {
  const [state, formAction, isPending] = useActionState(
    updateProductAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={product.id} />

      {/* Būsenos pranešimai */}
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Pakeitimai išsaugoti
        </div>
      )}

      {/* Pagrindiniai laukai */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Pavadinimas
        </h3>

        <div>
          <label
            htmlFor="name_lt"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Pavadinimas (LT)
          </label>
          <input
            type="text"
            id="name_lt"
            name="name_lt"
            defaultValue={product.nameLt ?? ''}
            required
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="name_en"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Pavadinimas (EN)
            </label>
            <input
              type="text"
              id="name_en"
              name="name_en"
              defaultValue={product.nameEn ?? ''}
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="name_ru"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Pavadinimas (RU)
            </label>
            <input
              type="text"
              id="name_ru"
              name="name_ru"
              defaultValue={product.nameRu ?? ''}
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="sku"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              SKU
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              defaultValue={product.sku ?? ''}
              placeholder="pvz. CS-6-4"
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white font-mono"
            />
          </div>
          <div>
            <label
              htmlFor="ean"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              EAN barkodas
            </label>
            <input
              type="text"
              id="ean"
              name="ean"
              defaultValue={product.ean ?? ''}
              placeholder="5906815850043"
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white font-mono"
            />
            <p className="mt-1 text-[11px] text-brand-gray-500">
              Iš tiekėjo kainoraščio. Unikalus per visus produktus.
            </p>
          </div>
        </div>
      </section>

      {/* Kainos */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Kainos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="price_eur"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Kaina (€) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="price_eur"
              name="price_eur"
              defaultValue={centsToEurInput(product.priceCents)}
              placeholder="18.50"
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="compare_price_eur"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Sena kaina (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="compare_price_eur"
              name="compare_price_eur"
              defaultValue={centsToEurInput(product.comparePriceCents)}
              placeholder="22.00"
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="b2b_price_eur"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              B2B kaina (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="b2b_price_eur"
              name="b2b_price_eur"
              defaultValue={centsToEurInput(product.b2bPriceCents)}
              placeholder="14.00"
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
        </div>

        {/* Savikaina — atskiras blokas, nes tai vidinis laukas */}
        <div className="pt-5 border-t border-[#eee]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div>
              <label
                htmlFor="cost_price_eur"
                className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
              >
                Savikaina be PVM (€)
              </label>
              <input
                type="text"
                inputMode="decimal"
                id="cost_price_eur"
                name="cost_price_eur"
                defaultValue={centsToEurInput(product.costPriceCents)}
                placeholder="1.85"
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
              />
              <p className="mt-1 text-[11px] text-brand-gray-500">
                Kiek mokate tiekėjui. Naudojama maržos skaičiavimui.
              </p>
            </div>
            <MarginDisplay
              priceCents={product.priceCents}
              costPriceCents={product.costPriceCents}
            />
          </div>
        </div>
      </section>

      {/* Sandėlis */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Sandėlis ir pakuotė
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="stock_quantity"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Likutis (vnt.) *
            </label>
            <input
              type="number"
              id="stock_quantity"
              name="stock_quantity"
              defaultValue={String(product.stockQuantity ?? 0)}
              min={0}
              step={1}
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="volume_ml"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Talpa (ml)
            </label>
            <input
              type="number"
              id="volume_ml"
              name="volume_ml"
              defaultValue={product.volumeMl != null ? String(product.volumeMl) : ''}
              min={0}
              step={1}
              placeholder="180"
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Aprašymai */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Aprašymas
        </h3>

        <div>
          <label
            htmlFor="description_lt"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Aprašymas (LT)
          </label>
          <textarea
            id="description_lt"
            name="description_lt"
            defaultValue={product.descriptionLt ?? ''}
            rows={4}
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="description_en"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Aprašymas (EN)
            </label>
            <textarea
              id="description_en"
              name="description_en"
              defaultValue={product.descriptionEn ?? ''}
              rows={4}
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="description_ru"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Aprašymas (RU)
            </label>
            <textarea
              id="description_ru"
              name="description_ru"
              defaultValue={product.descriptionRu ?? ''}
              rows={4}
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Būsenos */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Būsena
        </h3>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product.isActive}
            className="mt-0.5 w-4 h-4 rounded border-[#ddd]"
          />
          <div>
            <div className="text-sm font-semibold text-brand-gray-900">
              Aktyvus
            </div>
            <div className="text-[12px] text-brand-gray-500">
              Rodomas svetainėje ir gali būti pridedamas į krepšelį.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product.isFeatured}
            className="mt-0.5 w-4 h-4 rounded border-[#ddd]"
          />
          <div>
            <div className="text-sm font-semibold text-brand-gray-900">
              Rekomenduojamas
            </div>
            <div className="text-[12px] text-brand-gray-500">
              Rodomas „Populiariausi produktai" bloke pagrindiniame puslapyje.
            </div>
          </div>
        </label>
      </section>

      {/* Veiksmų juosta */}
      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-white border border-[#eee] rounded-xl p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <Link
          href="/admin/sandelis"
          className="px-4 py-2.5 border border-[#ddd] rounded-lg text-sm font-semibold text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
        >
          Atšaukti
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saugoma…' : 'Išsaugoti pakeitimus'}
        </button>
      </div>
    </form>
  )
}
