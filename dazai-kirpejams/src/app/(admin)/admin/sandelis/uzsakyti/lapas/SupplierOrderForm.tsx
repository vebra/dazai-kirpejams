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
 * Užsakymo lapas tiekėjui — lentelės principu. Matosi VISOS aktyvios prekės,
 * prie kiekvienos tiesiog įrašomas užsakomas kiekis (0/žemo likučio prekės
 * užpildytos siūlomu). Filtras greitam radimui, perjungiklis „tik užsakomas".
 * Išsaugoma / spausdinama tik tai, kam kiekis > 0. Likutis matomas ekrane,
 * bet NErodomas spausdinant (tiekėjui nematyti mūsų atsargų).
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
  /** Visos aktyvios prekės. */
  products: Row[]
  /** Prekės, kurias reikia užsakyti (0 ar žemas likutis) — su siūlomu kiekiu. */
  presetIds: string[]
  today: string
}) {
  // Prekės: pirma reikalingos užsakyti (0/žemas — preset tvarka), tada likusios pagal pavadinimą
  const ordered = useMemo(() => {
    const presetSet = new Set(presetIds)
    const byId = new Map(products.map((p) => [p.id, p]))
    const presets = presetIds
      .map((id) => byId.get(id))
      .filter((p): p is Row => !!p)
    const rest = products
      .filter((p) => !presetSet.has(p.id))
      .sort((a, b) => a.nameLt.localeCompare(b.nameLt, 'lt'))
    return [...presets, ...rest]
  }, [products, presetIds])

  // productId → užsakomas kiekis (0/žemas — siūlomas, kiti — 0)
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    const byId = new Map(products.map((p) => [p.id, p]))
    for (const id of presetIds) {
      const p = byId.get(id)
      if (p) init[id] = suggestedQty(p)
    }
    return init
  })
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('')
  const [onlyOrdered, setOnlyOrdered] = useState(false)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SupplierOrderResult | null>(null)

  const isOut = (p: Row) => p.stockQuantity <= 0
  const presetSet = useMemo(() => new Set(presetIds), [presetIds])

  // Suvestinė — pagal VISAS prekes (ne tik matomas)
  const orderedRows = useMemo(
    () => ordered.filter((p) => (qty[p.id] ?? 0) > 0),
    [ordered, qty]
  )
  const totalQty = orderedRows.reduce((s, p) => s + (qty[p.id] ?? 0), 0)

  // Matomos eilutės — pagal filtrą ir perjungiklį
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return ordered.filter((p) => {
      if (onlyOrdered && (qty[p.id] ?? 0) <= 0) return false
      if (!q) return true
      return (
        p.nameLt.toLowerCase().includes(q) ||
        (p.nameEn ?? '').toLowerCase().includes(q) ||
        (p.colorNumber ?? '').toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.ean ?? '').includes(q)
      )
    })
  }, [ordered, filter, onlyOrdered, qty])

  function setQtyValue(id: string, v: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(v) || 0) }))
  }
  function bump(id: string, by: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + by) }))
  }

  function save() {
    const items = orderedRows.map((p) => ({
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
      <div className="print-page max-w-4xl mx-auto">
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
    <div className="print-page max-w-4xl mx-auto bg-white">
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
            disabled={pending || orderedRows.length === 0}
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

      {/* Filtras + perjungiklis — nespausdinama */}
      <div className="print-hide mb-4 flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="🔍 Filtruoti pagal pavadinimą, spalvos nr., SKU ar EAN…"
          className="flex-1 min-w-[240px] px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setOnlyOrdered((v) => !v)}
          className={`px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap ${
            onlyOrdered
              ? 'bg-brand-magenta text-white border-brand-magenta'
              : 'bg-white text-brand-gray-900 border-[#ddd] hover:bg-[#F5F5F7]'
          }`}
        >
          {onlyOrdered ? '✓ Tik užsakomos' : 'Tik užsakomos'}
        </button>
      </div>

      <header className="border-b border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold">Purchase order</h1>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            Items: <strong>{orderedRows.length}</strong> · Total:{' '}
            <strong>{totalQty} pcs</strong>
          </div>
          <div>Date: {today}</div>
        </div>
      </header>

      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2 pr-2">Product</th>
            <th className="py-2 pr-2 w-[120px]">SKU / EAN</th>
            <th className="py-2 pr-2 text-center w-[70px] print-hide">Stock</th>
            <th className="py-2 pr-2 text-center w-[150px]">Ordered</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => {
            const out = isOut(p)
            const q = qty[p.id] ?? 0
            const toOrder = presetSet.has(p.id)
            return (
              <tr
                key={p.id}
                className={`border-b border-gray-200 ${q <= 0 ? 'print:hidden' : ''}`}
                style={q > 0 ? { backgroundColor: '#fdf2f8' } : undefined}
              >
                <td className="py-1.5 pr-2">
                  <span className={out ? 'text-red-700 font-semibold print:text-black print:font-normal' : ''}>
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameEn || p.nameLt}
                  </span>
                  {toOrder && (
                    <span className="print-hide ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 align-middle">
                      {out ? 'baigėsi' : 'žemas'}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-2 font-mono text-[11px]">
                  {p.sku ?? p.ean ?? '—'}
                </td>
                <td
                  className={`py-1.5 pr-2 text-center tabular-nums print-hide ${out ? 'text-red-700 font-bold' : 'text-brand-gray-500'}`}
                >
                  {p.stockQuantity}
                </td>
                <td className="py-1.5 pr-2">
                  {/* Spausdinant — tik skaičius; ekrane — −/laukas/+ */}
                  <span className="hidden print:inline tabular-nums font-bold">
                    {q}
                  </span>
                  <div className="print:hidden flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => bump(p.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7] disabled:opacity-40"
                      disabled={q <= 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={q || ''}
                      placeholder="0"
                      onChange={(e) => setQtyValue(p.id, Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-[#ddd] rounded-md text-sm text-center tabular-nums focus:outline-none focus:border-brand-magenta"
                    />
                    <button
                      type="button"
                      onClick={() => bump(p.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          {visible.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-sm text-brand-gray-500">
                {onlyOrdered
                  ? 'Dar nepasirinkote nė vienos prekės su kiekiu.'
                  : 'Nieko nerasta pagal filtrą.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
