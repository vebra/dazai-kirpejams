'use client'

import { useState, useMemo, useRef, useActionState } from 'react'
import {
  issueStockBatchToRepAction,
  type IssueBatchState,
} from '../actions'
import type { AdminProductListRow } from '@/lib/admin/queries'
import {
  ScanResultBanner,
  playScanFeedback,
  type ScanResult,
} from '@/components/admin/ScanFeedback'

const initialState: IssueBatchState = {}

type Rep = { id: string; name: string }

type Line = {
  id: string
  name: string
  colorNumber: string | null
  sku: string | null
  stock: number
  qty: number
}

const DATE_FMT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function IssueToRepForm({
  reps,
  products,
}: {
  reps: Rep[]
  products: AdminProductListRow[]
}) {
  const [state, formAction, isPending] = useActionState(
    issueStockBatchToRepAction,
    initialState
  )
  const [search, setSearch] = useState('')
  const [repId, setRepId] = useState('')
  const [list, setList] = useState<Line[]>([])
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)
  const scanIdRef = useRef(0)
  const repName = reps.find((r) => r.id === repId)?.name ?? ''

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const inList = new Set(list.map((l) => l.id))
    return products
      .filter(
        (p) =>
          !inList.has(p.id) &&
          (p.nameLt.toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [products, search, list])

  const itemsJson = JSON.stringify(
    list.map((l) => ({ product_id: l.id, qty: l.qty }))
  )
  const totalUnits = list.reduce((s, l) => s + l.qty, 0)

  function addProduct(p: AdminProductListRow) {
    setList((prev) =>
      prev.some((l) => l.id === p.id)
        ? prev
        : [
            ...prev,
            {
              id: p.id,
              name: p.nameLt,
              colorNumber: p.colorNumber,
              sku: p.sku,
              stock: p.stockQuantity ?? 0,
              qty: 1,
            },
          ]
    )
    setSearch('')
  }

  function setQty(id: string, qty: number) {
    setList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))
    )
  }

  // Skenavimas: EAN → prekė įkrenta į sąrašą (arba +1, jei jau yra).
  function handleScan(e: React.SyntheticEvent) {
    e.preventDefault()
    const val = scanRef.current?.value.trim() ?? ''
    if (scanRef.current) scanRef.current.value = ''
    scanRef.current?.focus()
    if (!val) return
    const id = ++scanIdRef.current
    const p = products.find((pp) => pp.ean && pp.ean === val)
    if (!p) {
      playScanFeedback('fail')
      setLastResult({ id, outcome: 'fail', title: 'Prekė nerasta', subtitle: `EAN: ${val}` })
      return
    }
    const existing = list.find((l) => l.id === p.id)
    const newQty = (existing?.qty ?? 0) + 1
    setList((prev) =>
      existing
        ? prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [
            ...prev,
            {
              id: p.id,
              name: p.nameLt,
              colorNumber: p.colorNumber,
              sku: p.sku,
              stock: p.stockQuantity ?? 0,
              qty: 1,
            },
          ]
    )
    const over = newQty > (p.stockQuantity ?? 0)
    playScanFeedback(over ? 'warn' : 'ok')
    setLastResult({
      id,
      outcome: over ? 'warn' : 'ok',
      title: `${p.colorNumber ? `${p.colorNumber} · ` : ''}${p.nameLt}`,
      subtitle: over
        ? `⚠ Sąraše ${newQty} vnt., o sandelyje tik ${p.stockQuantity}`
        : `Sąraše: ${newQty} vnt.${p.stockQuantity != null ? ` · sandelyje ${p.stockQuantity}` : ''}`,
    })
  }

  function remove(id: string) {
    setList((prev) => prev.filter((l) => l.id !== id))
  }

  // ── Po sėkmingo išdavimo — spausdinamas lapas ──
  if (state.issued) {
    const { rep, at, items } = state.issued
    const total = items.reduce((s, i) => s + i.qty, 0)
    return (
      <div>
        <div className="print-hide mb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            🖨 Spausdinti
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors"
          >
            + Naujas išdavimas
          </button>
        </div>

        <div className="print-area max-w-3xl bg-white">
          <header className="border-b border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold">Prekių išdavimo lapas</h1>
            <div className="mt-3 flex items-center justify-between text-sm flex-wrap gap-2">
              <div>
                Vadybininkė: <strong>{rep}</strong>
              </div>
              <div>Data: {DATE_FMT.format(new Date(at))}</div>
            </div>
          </header>

          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-2 w-[28px]">#</th>
                <th className="py-2 pr-2">Prekė</th>
                <th className="py-2 pr-2 text-right w-[90px]">Išduota</th>
                <th className="py-2 pr-2 text-right w-[120px]">Liko sandėlyje</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={i.productId} className="border-b border-gray-300">
                  <td className="py-1.5 pr-2 tabular-nums">{idx + 1}</td>
                  <td className="py-1.5 pr-2">{i.name}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">
                    {i.qty}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {i.balance}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-bold">
                <td className="py-2 pr-2" colSpan={2}>
                  Iš viso
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">{total}</td>
                <td />
              </tr>
            </tbody>
          </table>

          <div className="mt-12 grid grid-cols-2 gap-8 text-[12px]">
            <div className="border-t border-gray-400 pt-1.5">
              Išdavė (parašas)
            </div>
            <div className="border-t border-gray-400 pt-1.5">
              Priėmė (parašas)
            </div>
          </div>

          <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
            Color SHOCK · Dažai Kirpėjams · Prekių išdavimas vadybininkei
          </footer>
        </div>
      </div>
    )
  }

  // ── Sąrašo sudarymas ──
  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="rep"
          className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
        >
          Vadybininkė
        </label>
        <select
          id="rep"
          value={repId}
          onChange={(e) => setRepId(e.target.value)}
          className="w-full md:w-96 px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
        >
          <option value="" disabled>
            — Pasirinkite —
          </option>
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="rep" value={repName} />
        <input type="hidden" name="rep_id" value={repId} />
        <input type="hidden" name="items" value={itemsJson} />
      </div>

      {/* Skenavimas — greičiausias kelias pridėti prekę */}
      {repId && (
        <div className="bg-[#F9F9FB] rounded-lg border border-[#eee] p-3.5 space-y-3">
          <label
            htmlFor="issue-scan"
            className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500"
          >
            Nuskenuokite barkodą — prekė įkris į sąrašą (+1)
          </label>
          <div className="flex gap-2">
            <input
              ref={scanRef}
              id="issue-scan"
              autoComplete="off"
              placeholder="Nukreipkite skanerį čia…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleScan(e)
              }}
              className="flex-1 px-4 py-3 bg-white border-2 border-brand-magenta rounded-lg text-base focus:outline-none"
            />
            <button
              type="button"
              onClick={handleScan}
              className="px-5 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
            >
              Pridėti
            </button>
          </div>
          <ScanResultBanner result={lastResult} />
        </div>
      )}

      <div>
        <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
          Arba pridėkite ranka (paieška)
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ieškoti prekės (pavadinimas, numeris, SKU)…"
          className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
        />
        {results.length > 0 && (
          <div className="mt-2 max-h-60 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left"
              >
                <span className="text-brand-gray-900">
                  {p.colorNumber ? `${p.colorNumber} · ` : ''}
                  {p.nameLt}
                </span>
                <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">
                  sandelyje {p.stockQuantity}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sąrašas */}
      {list.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
          Sąrašas tuščias. Susiraskite prekes ir pridėkite, kiek vadybininkei
          reikia.
        </div>
      ) : (
        <div className="border border-[#eee] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-3 py-2 text-left">Prekė</th>
                <th className="px-3 py-2 text-center w-[90px]">Sandelyje</th>
                <th className="px-3 py-2 text-center w-[120px]">Kiekis</th>
                <th className="px-3 py-2 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const over = l.qty > l.stock
                return (
                  <tr key={l.id} className="border-t border-[#eee]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-brand-gray-900">
                        {l.colorNumber ? `${l.colorNumber} · ` : ''}
                        {l.name}
                      </div>
                      {l.sku && (
                        <div className="text-[11px] text-brand-gray-500 font-mono">
                          {l.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-brand-gray-500">
                      {l.stock}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={l.qty}
                        onChange={(e) =>
                          setQty(l.id, parseInt(e.target.value, 10) || 1)
                        }
                        className={`w-20 px-2 py-1.5 border rounded-md text-sm text-center font-semibold ${
                          over
                            ? 'border-red-300 text-red-600 bg-red-50'
                            : 'border-[#ddd] text-brand-gray-900'
                        }`}
                      />
                      {over && (
                        <div className="text-[10px] text-red-600 mt-0.5">
                          viršija likutį
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(l.id)}
                        className="text-brand-gray-400 hover:text-red-600 transition-colors"
                        title="Pašalinti"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-brand-gray-500">
          Prekių sąraše: <strong className="text-brand-gray-900">{list.length}</strong>{' '}
          · Iš viso vienetų:{' '}
          <strong className="text-brand-gray-900">{totalUnits}</strong>
        </div>
        <button
          type="submit"
          disabled={isPending || list.length === 0 || !repId}
          className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Išduodama…' : 'Išduoti sąrašą'}
        </button>
      </div>
      <p className="text-[12px] text-brand-gray-500">
        Pateikus, visos prekės iš karto nurašomos iš sandėlio (viskas arba
        nieko), įrašoma į žurnalą, ir gausite spausdinamą išdavimo lapą.
      </p>
    </form>
  )
}
