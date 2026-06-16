'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { AdminProductListRow } from '@/lib/admin/queries'
import { PrintButton } from '@/components/admin/PrintButton'
import {
  createSupplierOrderAction,
  type SupplierOrderResult,
} from '../../actions'

/**
 * Užsakymo lapas tiekėjui — pildomas TIESIAI svetainėje. Kiekvienai prekei
 * (žemas likutis arba baigėsi) galima įvesti užsakomą kiekį (iš anksto
 * užpildyta siūlomu), įtraukti/išmesti prekę, prirašyti pastabą ir IŠSAUGOTI
 * į istoriją (supplier_orders). Užpildytą lapą galima ir atspausdinti.
 */

type Row = AdminProductListRow

function suggestedQty(p: Row): number {
  return Math.max((p.reorderPoint ?? 0) * 2 - p.stockQuantity, 1)
}

export function SupplierOrderForm({
  products,
  today,
}: {
  products: Row[]
  today: string
}) {
  // productId → užsakomas kiekis (pradinis = siūlomas)
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, suggestedQty(p)]))
  )
  // Įtrauktos prekės (pradžioje visos)
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, true]))
  )
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SupplierOrderResult | null>(null)

  const isOut = (p: Row) => p.stockQuantity <= 0

  const activeRows = useMemo(
    () => products.filter((p) => included[p.id] && (qty[p.id] ?? 0) > 0),
    [products, included, qty]
  )
  const totalQty = activeRows.reduce((s, p) => s + (qty[p.id] ?? 0), 0)

  function setQtyValue(id: string, v: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(v) || 0) }))
  }

  function save() {
    const items = activeRows.map((p) => ({
      productId: p.id,
      name: p.nameLt,
      nameEn: p.nameEn,
      colorNumber: p.colorNumber,
      sku: p.sku,
      ean: p.ean,
      stockAtOrder: p.stockQuantity,
      qty: qty[p.id] ?? 0,
    }))
    startTransition(async () => {
      const res = await createSupplierOrderAction(items, note)
      setResult(res)
    })
  }

  // ── Išsaugota ──
  if (result?.ok) {
    return (
      <div className="print-page max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✓</span>
            <div>
              <div className="text-lg font-bold text-brand-gray-900">
                Užsakymas išsaugotas
              </div>
              <div className="text-sm text-brand-gray-500">
                {result.itemCount} prek(ės) · iš viso {result.totalQty} vnt.
                Įrašyta į istoriją.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/sandelis/uzsakyti/istorija"
              className="px-4 py-2.5 bg-brand-magenta text-white rounded-lg text-[13px] font-semibold hover:bg-brand-magenta-dark"
            >
              Peržiūrėti istoriją
            </Link>
            <Link
              href="/admin/sandelis/uzsakyti"
              className="px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900 hover:bg-[#e8e8ec]"
            >
              ← Į „Ką užsakyti“
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="print-page max-w-3xl mx-auto bg-white">
      {/* Valdikliai — nespausdinami */}
      <div className="print-hide mb-4 flex items-center justify-between gap-2 flex-wrap">
        <Link
          href="/admin/sandelis/uzsakyti"
          className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
        >
          ← Atgal
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sandelis/uzsakyti/istorija"
            className="px-3 py-1.5 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg text-[12px] font-semibold hover:bg-[#F5F5F7] transition-colors"
          >
            Istorija
          </Link>
          <PrintButton
            label="🖨 Print"
            className="px-4 py-2 bg-brand-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending || activeRows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-magenta text-white rounded-lg text-sm font-semibold hover:bg-brand-magenta-dark active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {pending ? (
              <>
                <span
                  className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden
                />
                Saugoma…
              </>
            ) : (
              '💾 Išsaugoti užsakymą'
            )}
          </button>
        </div>
      </div>

      {result && !result.ok && (
        <div className="print-hide mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {result.error}
        </div>
      )}

      <header className="border-b border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">Purchase order</h1>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            Items: <strong>{activeRows.length}</strong> · Total:{' '}
            <strong>{totalQty} pcs</strong>
          </div>
          <div>Date: {today}</div>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="text-sm">
          All stock levels are above threshold — nothing to order. 👍
        </div>
      ) : (
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2 pr-2 w-[28px] print-hide">✓</th>
              <th className="py-2 pr-2 w-[28px]">#</th>
              <th className="py-2 pr-2">Product</th>
              <th className="py-2 pr-2 w-[110px]">SKU / EAN</th>
              <th className="py-2 pr-2 text-center w-[60px]">Stock</th>
              <th className="py-2 pr-2 text-center w-[70px] print-hide">
                Suggested
              </th>
              <th className="py-2 pr-2 text-center w-[90px]">Ordered</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const out = isOut(p)
              const on = included[p.id]
              return (
                <tr
                  key={p.id}
                  className={`border-b border-gray-300 ${out ? 'bg-red-100' : ''} ${!on ? 'opacity-40 print:hidden' : ''}`}
                >
                  <td className="py-1.5 pr-2 print-hide">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) =>
                        setIncluded((prev) => ({
                          ...prev,
                          [p.id]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-brand-magenta cursor-pointer"
                    />
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">{i + 1}</td>
                  <td
                    className={`py-1.5 pr-2 ${out ? 'text-red-700 font-bold' : ''}`}
                  >
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameEn || p.nameLt}
                    {out ? ' (out of stock)' : ''}
                  </td>
                  <td className="py-1.5 pr-2 font-mono text-[11px]">
                    {p.sku ?? p.ean ?? '—'}
                  </td>
                  <td
                    className={`py-1.5 pr-2 text-center tabular-nums ${out ? 'text-red-700 font-bold' : ''}`}
                  >
                    {p.stockQuantity}
                  </td>
                  <td className="py-1.5 pr-2 text-center tabular-nums text-gray-500 print-hide">
                    {suggestedQty(p)}
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    {/* Spausdinant — tik skaičius; ekrane — įvedimo laukas */}
                    <span className="hidden print:inline tabular-nums font-bold">
                      {on ? (qty[p.id] ?? 0) : ''}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={qty[p.id] ?? 0}
                      disabled={!on}
                      onChange={(e) =>
                        setQtyValue(p.id, Number(e.target.value))
                      }
                      className="print:hidden w-20 px-2 py-1 border border-[#ddd] rounded-md text-sm text-center tabular-nums focus:outline-none focus:border-brand-magenta disabled:bg-[#f5f5f7] disabled:text-gray-400"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Pastaba — matosi ir spausdinant, jei užpildyta */}
      <div className="mt-6">
        <label className="print-hide block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
          Pastaba (nebūtina)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Pvz. pristatymo terminas, tiekėjas, kontaktas…"
          className="print-hide w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
        />
        {note.trim() && (
          <div className="hidden print:block text-[12px] mt-2">
            <strong>Note:</strong> {note}
          </div>
        )}
      </div>

      <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
        Dažai Kirpėjams · Purchase order · Suggested qty = top up to double the
        reorder threshold
      </footer>
    </div>
  )
}
