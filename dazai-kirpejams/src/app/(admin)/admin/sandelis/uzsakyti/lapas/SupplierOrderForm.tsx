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
 * Užsakymo lapas tiekėjui — pildomas TIESIAI svetainėje. Žemo likučio / baigusios
 * prekės pridedamos automatiškai, o per paiešką galima įtraukti BET KURIĄ kitą
 * prekę. Kiekviena eilutė turi užsakomo kiekio lauką, prekes galima pašalinti,
 * prirašyti pastabą ir IŠSAUGOTI į istoriją (supplier_orders). Lapą galima ir
 * atspausdinti su jau įrašytais kiekiais.
 */

type Row = AdminProductListRow

function suggestedQty(p: Row): number {
  return Math.max((p.reorderPoint ?? 0) * 2 - p.stockQuantity, 1)
}

export function SupplierOrderForm({
  products,
  presetIds,
  today,
}: {
  /** Visos aktyvios prekės — paieškai/pridėjimui. */
  products: Row[]
  /** Prekės, kurias reikia užsakyti (0 ar žemas likutis) — pridedamos iš karto. */
  presetIds: string[]
  today: string
}) {
  const pmap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  // Užsakymo eilutės — produktų ID tvarka (pradžioje žemo likučio prekės)
  const [orderIds, setOrderIds] = useState<string[]>(() =>
    presetIds.filter((id) => pmap.has(id))
  )
  // productId → užsakomas kiekis
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      presetIds
        .map((id) => pmap.get(id))
        .filter((p): p is Row => !!p)
        .map((p) => [p.id, suggestedQty(p)])
    )
  )
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SupplierOrderResult | null>(null)

  const isOut = (p: Row) => p.stockQuantity <= 0

  const rows = useMemo(
    () => orderIds.map((id) => pmap.get(id)).filter((p): p is Row => !!p),
    [orderIds, pmap]
  )
  const totalQty = rows.reduce((s, p) => s + (qty[p.id] ?? 0), 0)

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const inOrder = new Set(orderIds)
    return products
      .filter(
        (p) =>
          !inOrder.has(p.id) &&
          (p.nameLt.toLowerCase().includes(q) ||
            (p.nameEn ?? '').toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.ean ?? '').includes(q))
      )
      .slice(0, 8)
  }, [products, search, orderIds])

  function addProduct(p: Row) {
    setOrderIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]))
    setQty((prev) => ({ ...prev, [p.id]: prev[p.id] ?? suggestedQty(p) }))
    setSearch('')
  }

  function removeProduct(id: string) {
    setOrderIds((prev) => prev.filter((x) => x !== id))
  }

  function setQtyValue(id: string, v: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(v) || 0) }))
  }

  function save() {
    const items = rows
      .filter((p) => (qty[p.id] ?? 0) > 0)
      .map((p) => ({
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

  const orderableCount = rows.filter((p) => (qty[p.id] ?? 0) > 0).length

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
            disabled={pending || orderableCount === 0}
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

      {/* Prekės pridėjimas per paiešką — nespausdinama */}
      <div className="print-hide mb-6 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="➕ Pridėti prekę — ieškoti pagal pavadinimą, spalvos nr., SKU ar EAN…"
          className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#ddd] rounded-lg shadow-lg overflow-hidden">
            {searchResults.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#F5F5F7] flex items-center justify-between gap-3 border-b border-[#f0f0f0] last:border-0"
              >
                <span className="text-sm text-brand-gray-900 truncate">
                  {p.colorNumber ? `${p.colorNumber} · ` : ''}
                  {p.nameLt}
                  <span className="ml-2 text-[11px] font-mono text-brand-gray-400">
                    {p.sku ?? p.ean ?? ''}
                  </span>
                </span>
                <span
                  className={`text-[12px] flex-shrink-0 ${p.stockQuantity <= 0 ? 'text-red-600 font-bold' : 'text-brand-gray-500'}`}
                >
                  likutis: {p.stockQuantity}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <header className="border-b border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">Purchase order</h1>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            Items: <strong>{orderableCount}</strong> · Total:{' '}
            <strong>{totalQty} pcs</strong>
          </div>
          <div>Date: {today}</div>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="text-sm text-brand-gray-500">
          Sąrašas tuščias. Pridėkite prekių per paiešką viršuje.
        </div>
      ) : (
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2 pr-2 w-[28px]">#</th>
              <th className="py-2 pr-2">Product</th>
              <th className="py-2 pr-2 w-[110px]">SKU / EAN</th>
              <th className="py-2 pr-2 text-center w-[60px] print-hide">Stock</th>
              <th className="py-2 pr-2 text-center w-[90px]">Ordered</th>
              <th className="py-2 pr-2 w-[36px] print-hide" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const out = isOut(p)
              return (
                <tr
                  key={p.id}
                  className={`border-b border-gray-300 ${out ? 'bg-red-100 print:bg-transparent' : ''}`}
                >
                  <td className="py-1.5 pr-2 tabular-nums">{i + 1}</td>
                  <td
                    className={`py-1.5 pr-2 ${out ? 'text-red-700 font-bold print:text-black print:font-normal' : ''}`}
                  >
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameEn || p.nameLt}
                    {out ? <span className="print-hide"> (out of stock)</span> : ''}
                  </td>
                  <td className="py-1.5 pr-2 font-mono text-[11px]">
                    {p.sku ?? p.ean ?? '—'}
                  </td>
                  <td
                    className={`py-1.5 pr-2 text-center tabular-nums print-hide ${out ? 'text-red-700 font-bold' : ''}`}
                  >
                    {p.stockQuantity}
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    {/* Spausdinant — tik skaičius; ekrane — įvedimo laukas */}
                    <span className="hidden print:inline tabular-nums font-bold">
                      {qty[p.id] ?? 0}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={qty[p.id] ?? 0}
                      onChange={(e) => setQtyValue(p.id, Number(e.target.value))}
                      className="print:hidden w-20 px-2 py-1 border border-[#ddd] rounded-md text-sm text-center tabular-nums focus:outline-none focus:border-brand-magenta"
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-center print-hide">
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      title="Pašalinti iš užsakymo"
                      className="w-6 h-6 inline-flex items-center justify-center text-brand-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      ✕
                    </button>
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
        Dažai Kirpėjams · Purchase order
      </footer>
    </div>
  )
}
