'use client'

import { useState, useMemo, useActionState, useRef, useEffect } from 'react'
import {
  createDiscountCodeAction,
  toggleDiscountCodeAction,
  deleteDiscountCodeAction,
  type CreateDiscountCodeState,
} from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'
import type { AdminDiscountCode, AdminProductListRow } from '@/lib/admin/queries'

type CategoryOption = {
  categoryId: string
  categoryNameLt: string
  count: number
}

const initialState: CreateDiscountCodeState = {}

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

function discountDisplay(code: AdminDiscountCode): string {
  if (code.discountType === 'percent') return `−${code.value}%`
  return `−${formatCents(code.value)}`
}

export function DiscountCodesSection({
  codes,
  products = [],
  categories = [],
}: {
  codes: AdminDiscountCode[]
  products?: AdminProductListRow[]
  categories?: CategoryOption[]
}) {
  const [showForm, setShowForm] = useState(codes.length === 0)
  const [state, formAction, isPending] = useActionState(
    createDiscountCodeAction,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  const [scope, setScope] = useState<'all' | 'scoped'>('all')
  const [search, setSearch] = useState('')
  const [selProducts, setSelProducts] = useState<Set<string>>(new Set())
  const [selCategories, setSelCategories] = useState<Set<string>>(new Set())

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.nameLt.toLowerCase().includes(q) ||
        (p.colorNumber ?? '').toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)
    )
  }, [products, search])

  // Po sėkmingo sukūrimo išvalom formą, kad naujo kodo laukai nesikartotų
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tyčinis post-submit reset pattern'as: po sėkmingo server action'o forma išvaloma vieną kartą
      setScope('all')
      setSelProducts(new Set())
      setSelCategories(new Set())
      setSearch('')
    }
  }, [state.success])

  return (
    <div className="space-y-5">
      {/* Antraštė su „Pridėti" mygtuku */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-brand-gray-500">
            Iš viso: <strong className="text-brand-gray-900">{codes.length}</strong>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            + Pridėti kodą
          </button>
        )}
      </div>

      {/* Nauja forma */}
      {showForm && (
        <form
          ref={formRef}
          action={formAction}
          className="p-5 bg-[#F9F9FB] border border-[#eee] rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-[13px] font-bold text-brand-gray-900">
              Naujas nuolaidų kodas
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[12px] text-brand-gray-500 hover:text-brand-gray-900"
            >
              Uždaryti
            </button>
          </div>

          {state.error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
              ✓ Kodas sukurtas
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="code"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Kodas *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                required
                placeholder="PAVASARIS25"
                maxLength={32}
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-brand-magenta"
              />
              <p className="mt-1 text-[11px] text-brand-gray-500">
                3–32 simboliai, be tarpų. Klientas įves krepšelyje.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Aprašymas (vidinis)
              </label>
              <input
                type="text"
                id="description"
                name="description"
                placeholder="Pavasario akcija 2026"
                maxLength={100}
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="discount_type"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Tipas *
              </label>
              <select
                id="discount_type"
                name="discount_type"
                required
                defaultValue="percent"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              >
                <option value="percent">Procentas (%)</option>
                <option value="fixed_cents">Fiksuota suma (€)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="value"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Dydis *
              </label>
              <input
                type="text"
                inputMode="decimal"
                id="value"
                name="value"
                required
                placeholder="25"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
              <p className="mt-1 text-[11px] text-brand-gray-500">
                % (1–100) arba EUR suma
              </p>
            </div>

            <div>
              <label
                htmlFor="min_order_eur"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Min. užsakymas (€)
              </label>
              <input
                type="text"
                inputMode="decimal"
                id="min_order_eur"
                name="min_order_eur"
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="valid_from"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Galioja nuo
              </label>
              <input
                type="date"
                id="valid_from"
                name="valid_from"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
            </div>

            <div>
              <label
                htmlFor="valid_until"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Galioja iki
              </label>
              <input
                type="date"
                id="valid_until"
                name="valid_until"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
            </div>

            <div>
              <label
                htmlFor="max_uses"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Maks. panaudojimų
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="max_uses"
                name="max_uses"
                placeholder="Be apribojimo"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
            </div>
          </div>

          {/* Apimtis — kam galioja */}
          <div className="border-t border-[#eee] pt-4 space-y-3">
            <div className="text-[12px] font-semibold text-brand-gray-900">
              Kam galioja
            </div>
            <input type="hidden" name="scope" value={scope} />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Visoms prekėms'],
                  ['scoped', 'Tik išrinktoms prekėms / kategorijoms'],
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
                    name="_scope_radio"
                    value={val}
                    checked={scope === val}
                    onChange={() => setScope(val)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>

            {scope === 'scoped' && (
              <div className="space-y-4 pt-1">
                {/* Kategorijos */}
                {categories.length > 0 && (
                  <div>
                    <div className="text-[12px] font-semibold text-brand-gray-900 mb-1.5">
                      Kategorijos
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => {
                        const on = selCategories.has(c.categoryId)
                        return (
                          <label
                            key={c.categoryId}
                            className={`px-3 py-1.5 rounded-lg border text-[13px] cursor-pointer transition-colors ${
                              on
                                ? 'bg-brand-magenta/10 border-brand-magenta text-brand-magenta font-semibold'
                                : 'bg-white border-[#ddd] text-brand-gray-900 hover:border-brand-magenta'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                setSelCategories((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(c.categoryId)) next.delete(c.categoryId)
                                  else next.add(c.categoryId)
                                  return next
                                })
                              }
                              className="sr-only"
                            />
                            {c.categoryNameLt} ({c.count})
                          </label>
                        )
                      })}
                    </div>
                    {Array.from(selCategories).map((id) => (
                      <input key={id} type="hidden" name="category_ids" value={id} />
                    ))}
                  </div>
                )}

                {/* Prekės */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="text-[12px] font-semibold text-brand-gray-900">
                      Prekės
                    </div>
                    <span className="text-[11px] text-brand-gray-500">
                      Pažymėta: {selProducts.size}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ieškoti pagal pavadinimą, numerį, SKU…"
                    className="w-full px-3.5 py-2 bg-white border border-[#ddd] rounded-lg text-sm mb-2 focus:outline-none focus:border-brand-magenta"
                  />
                  <div className="max-h-60 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-5 text-center text-sm text-brand-gray-500">
                        Nieko nerasta.
                      </div>
                    ) : (
                      filteredProducts.map((pr) => {
                        const on = selProducts.has(pr.id)
                        return (
                          <label
                            key={pr.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-[#F9F9FB] cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                setSelProducts((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(pr.id)) next.delete(pr.id)
                                  else next.add(pr.id)
                                  return next
                                })
                              }
                              className="w-4 h-4 accent-brand-magenta"
                            />
                            <span className="flex-1 text-brand-gray-900">
                              {pr.colorNumber ? `${pr.colorNumber} · ` : ''}
                              {pr.nameLt}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  {Array.from(selProducts).map((id) => (
                    <input key={id} type="hidden" name="product_ids" value={id} />
                  ))}
                </div>
                <p className="text-[11px] text-brand-gray-500">
                  Nuolaida bus skaičiuojama tik nuo pažymėtų prekių / kategorijų
                  sumos krepšelyje.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Kuriama…' : 'Sukurti kodą'}
            </button>
          </div>
        </form>
      )}

      {/* Kodų lentelė */}
      {codes.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          Nuolaidų kodų dar nėra.
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Kodas</th>
                  <th className="px-4 py-3 text-left">Aprašymas</th>
                  <th className="px-4 py-3 text-right">Nuolaida</th>
                  <th className="px-4 py-3 text-right">Min. užs.</th>
                  <th className="px-4 py-3 text-center w-[100px]">Naudota</th>
                  <th className="px-4 py-3 text-left">Galioja</th>
                  <th className="px-4 py-3 text-center w-[100px]">Būsena</th>
                  <th className="px-4 py-3 text-right w-[140px]"></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const usedInfo = c.maxUses
                    ? `${c.usedCount} / ${c.maxUses}`
                    : c.usedCount.toString()
                  const validRange =
                    c.validFrom || c.validUntil
                      ? `${c.validFrom ? formatDate(c.validFrom) : '—'} → ${
                          c.validUntil ? formatDate(c.validUntil) : '∞'
                        }`
                      : 'Visada'
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-brand-gray-900">
                          {c.code}
                        </span>
                        {c.productCount + c.categoryCount > 0 && (
                          <span className="block mt-0.5 text-[10px] text-brand-magenta font-semibold">
                            tik išrinktoms
                            {c.productCount > 0 ? ` · ${c.productCount} prekė(s)` : ''}
                            {c.categoryCount > 0 ? ` · ${c.categoryCount} kat.` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                        {c.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-magenta">
                        {discountDisplay(c)}
                      </td>
                      <td className="px-4 py-3 text-right text-brand-gray-500 text-[12px]">
                        {c.minOrderCents > 0 ? formatCents(c.minOrderCents) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-brand-gray-500 text-[12px]">
                        {usedInfo}
                      </td>
                      <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                        {validRange}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Aktyvus
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-gray-100 text-gray-500 border-gray-200">
                            Išjungtas
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <form action={toggleDiscountCodeAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <input
                              type="hidden"
                              name="next_active"
                              value={(!c.isActive).toString()}
                            />
                            <SubmitButton
                              pendingLabel="Keičiama…"
                              spinnerSize="w-3 h-3"
                              className="px-2.5 py-1 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded text-[11px] font-semibold text-brand-gray-900"
                            >
                              {c.isActive ? 'Išjungti' : 'Įjungti'}
                            </SubmitButton>
                          </form>
                          <form action={deleteDiscountCodeAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <SubmitButton
                              pendingLabel="Trinama…"
                              spinnerSize="w-3 h-3"
                              onClick={(e) => {
                                if (!confirm(`Tikrai trinti kodą „${c.code}"?`)) {
                                  e.preventDefault()
                                }
                              }}
                              className="px-2.5 py-1 bg-white border border-[#ddd] rounded text-[11px] font-semibold text-red-700 hover:bg-red-50 hover:border-red-300"
                            >
                              Trinti
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
