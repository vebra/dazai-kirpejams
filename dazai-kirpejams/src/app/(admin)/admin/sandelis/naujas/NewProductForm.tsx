'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createProductAction, type UpdateProductState } from '../actions'
import type { AdminCategoryOption } from '@/lib/admin/queries'

const initial: UpdateProductState = {}
const inputCls =
  'w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white'
const labelCls = 'block text-[13px] font-semibold text-brand-gray-900 mb-1.5'
const sectionCls =
  'bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5'
const headCls = 'text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500'

export function NewProductForm({ categories }: { categories: AdminCategoryOption[] }) {
  const [state, formAction, isPending] = useActionState(createProductAction, initial)

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {/* Pavadinimas + kategorija */}
      <section className={sectionCls}>
        <h3 className={headCls}>Pagrindinė informacija</h3>
        <div>
          <label htmlFor="name_lt" className={labelCls}>Pavadinimas (LT) *</label>
          <input id="name_lt" name="name_lt" required className={inputCls} placeholder="pvz. 6.4 Color SHOCK — Šviesiai varinė" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name_en" className={labelCls}>Pavadinimas (EN) *</label>
            <input id="name_en" name="name_en" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="name_ru" className={labelCls}>Pavadinimas (RU) *</label>
            <input id="name_ru" name="name_ru" required className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="category_id" className={labelCls}>Kategorija *</label>
            <select id="category_id" name="category_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>— pasirinkite —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameLt}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="slug" className={labelCls}>Nuoroda (slug)</label>
            <input id="slug" name="slug" className={inputCls} placeholder="auto iš pavadinimo, jei tuščia" />
            <p className="mt-1 text-[11px] text-brand-gray-500">Palikite tuščią — sugeneruosiu automatiškai.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sku" className={labelCls}>SKU</label>
            <input id="sku" name="sku" className={`${inputCls} font-mono`} placeholder="pvz. CS-6-4" />
          </div>
          <div>
            <label htmlFor="ean" className={labelCls}>EAN barkodas</label>
            <input id="ean" name="ean" className={`${inputCls} font-mono`} placeholder="5906815850043" />
          </div>
        </div>
      </section>

      {/* Kainos */}
      <section className={sectionCls}>
        <h3 className={headCls}>Kainos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="price_eur" className={labelCls}>Kaina (€) *</label>
            <input id="price_eur" name="price_eur" inputMode="decimal" required className={inputCls} placeholder="7.90" />
          </div>
          <div>
            <label htmlFor="compare_price_eur" className={labelCls}>Sena kaina (€)</label>
            <input id="compare_price_eur" name="compare_price_eur" inputMode="decimal" className={inputCls} placeholder="9.90" />
          </div>
          <div>
            <label htmlFor="b2b_price_eur" className={labelCls}>B2B kaina (€)</label>
            <input id="b2b_price_eur" name="b2b_price_eur" inputMode="decimal" className={inputCls} placeholder="4.99" />
          </div>
        </div>
        <div className="pt-5 border-t border-[#eee]">
          <label htmlFor="cost_price_eur" className={labelCls}>Savikaina be PVM (€)</label>
          <input id="cost_price_eur" name="cost_price_eur" inputMode="decimal" className={`${inputCls} sm:max-w-xs`} placeholder="1.85" />
          <p className="mt-1 text-[11px] text-brand-gray-500">Kiek mokate tiekėjui (vidinis laukas, maržai).</p>
        </div>
      </section>

      {/* Sandėlis + pakuotė */}
      <section className={sectionCls}>
        <h3 className={headCls}>Sandėlis ir pakuotė</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="stock_quantity" className={labelCls}>Likutis (vnt.)</label>
            <input id="stock_quantity" name="stock_quantity" type="number" min={0} step={1} defaultValue="0" className={inputCls} />
          </div>
          <div>
            <label htmlFor="volume_ml" className={labelCls}>Talpa (ml)</label>
            <input id="volume_ml" name="volume_ml" type="number" min={0} step={1} className={inputCls} placeholder="180" />
          </div>
        </div>
      </section>

      {/* Spalva — dažams (nebūtina) */}
      <section className={sectionCls}>
        <h3 className={headCls}>Spalva (tik dažams — nebūtina)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="color_number" className={labelCls}>Spalvos nr.</label>
            <input id="color_number" name="color_number" className={inputCls} placeholder="6.4" />
          </div>
          <div>
            <label htmlFor="color_name" className={labelCls}>Spalvos pavadinimas</label>
            <input id="color_name" name="color_name" className={inputCls} placeholder="Šviesiai varinė" />
          </div>
          <div>
            <label htmlFor="color_hex" className={labelCls}>Spalvos HEX</label>
            <input id="color_hex" name="color_hex" className={inputCls} placeholder="#C84A2B" />
          </div>
        </div>
      </section>

      {/* Aprašymai */}
      <section className={sectionCls}>
        <h3 className={headCls}>Aprašymas (nebūtina)</h3>
        <div>
          <label htmlFor="description_lt" className={labelCls}>Aprašymas (LT)</label>
          <textarea id="description_lt" name="description_lt" rows={3} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <label htmlFor="description_en" className={labelCls}>Aprašymas (EN)</label>
            <textarea id="description_en" name="description_en" rows={3} className={inputCls} />
          </div>
          <div>
            <label htmlFor="description_ru" className={labelCls}>Aprašymas (RU)</label>
            <textarea id="description_ru" name="description_ru" rows={3} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Būsena */}
      <section className={sectionCls}>
        <h3 className={headCls}>Būsena</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked className="mt-0.5 w-4 h-4 rounded border-[#ddd]" />
          <div>
            <div className="text-sm font-semibold text-brand-gray-900">Aktyvus</div>
            <div className="text-[12px] text-brand-gray-500">Iškart rodomas svetainėje. Nuimkite, jei norite paruošti prieš publikuojant.</div>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="is_featured" className="mt-0.5 w-4 h-4 rounded border-[#ddd]" />
          <div>
            <div className="text-sm font-semibold text-brand-gray-900">Rekomenduojamas</div>
            <div className="text-[12px] text-brand-gray-500">Rodomas „Populiariausi“ bloke pagrindiniame puslapyje.</div>
          </div>
        </label>
      </section>

      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-white border border-[#eee] rounded-xl p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <Link href="/admin/sandelis" className="px-4 py-2.5 border border-[#ddd] rounded-lg text-sm font-semibold text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors">
          Atšaukti
        </Link>
        <button type="submit" disabled={isPending} className="px-6 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isPending ? 'Kuriama…' : 'Sukurti produktą'}
        </button>
      </div>

      <p className="text-[12px] text-brand-gray-500 text-center pb-4">
        Sukūrus būsite nukreipti į produkto redagavimą — ten galėsite įkelti nuotraukas
        ir nustatyti didmenos kainas.
      </p>
    </form>
  )
}
