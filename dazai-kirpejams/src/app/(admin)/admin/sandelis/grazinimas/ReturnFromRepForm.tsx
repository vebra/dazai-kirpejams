'use client'

import { useState, useMemo, useActionState } from 'react'
import {
  returnStockBatchFromRepAction,
  type ReturnBatchState,
} from '../actions'
import type { RepHeldItem, RepIssuanceDay } from '@/lib/admin/rep-reports'

const initialState: ReturnBatchState = {}

type Rep = { id: string; name: string }

type Row = {
  key: string // date + productId (ta pati prekė gali būti išduota kelias dienas)
  date: string
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  issued: number // kiek tą dieną išduota
  checked: boolean
  qty: number
}

const DATE_FMT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function ReturnFromRepForm({
  reps,
  heldByRep,
  issuancesByRep,
}: {
  reps: Rep[]
  heldByRep: Record<string, RepHeldItem[]>
  issuancesByRep: Record<string, RepIssuanceDay[]>
}) {
  const [state, formAction, isPending] = useActionState(
    returnStockBatchFromRepAction,
    initialState
  )
  const [repId, setRepId] = useState('')
  const [filter, setFilter] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const repName = reps.find((r) => r.id === repId)?.name ?? ''

  // Kiek vadybininkė šiuo metu turi kiekvienos prekės (po pardavimų/grąžinimų).
  const heldMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const h of heldByRep[repId] ?? []) m.set(h.productId, h.held)
    return m
  }, [heldByRep, repId])

  function changeRep(id: string) {
    setRepId(id)
    setFilter('')
    const days = issuancesByRep[id] ?? []
    const next: Row[] = []
    for (const d of days) {
      for (const it of d.items) {
        next.push({
          key: `${d.date}__${it.productId}`,
          date: d.date,
          productId: it.productId,
          name: it.name,
          colorNumber: it.colorNumber,
          sku: it.sku,
          issued: it.qty,
          checked: false,
          qty: it.qty,
        })
      }
    }
    setRows(next)
  }

  function toggle(key: string, checked: boolean) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, checked } : r)))
  }

  function setQty(key: string, qty: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, qty: Math.min(r.issued, Math.max(1, qty)), checked: true }
          : r
      )
    )
  }

  function setAll(checked: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, checked })))
  }

  // Susumuojam grąžinamą kiekį pagal prekę (ta pati prekė gali būti keliose dienose).
  const mergedByProduct = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      if (r.checked && r.qty > 0) {
        m.set(r.productId, (m.get(r.productId) ?? 0) + r.qty)
      }
    }
    return m
  }, [rows])

  // Prekės, kurių grąžinama daugiau, nei vadybininkė šiuo metu turi.
  const overProducts = useMemo(() => {
    const s = new Set<string>()
    for (const [pid, qty] of mergedByProduct) {
      if (qty > (heldMap.get(pid) ?? 0)) s.add(pid)
    }
    return s
  }, [mergedByProduct, heldMap])

  const itemsJson = JSON.stringify(
    [...mergedByProduct.entries()].map(([product_id, qty]) => ({ product_id, qty }))
  )
  const selectedCount = mergedByProduct.size
  const totalUnits = [...mergedByProduct.values()].reduce((s, q) => s + q, 0)
  const allChecked = rows.length > 0 && rows.every((r) => r.checked)

  // Filtruotos eilutės, sugrupuotos pagal dieną (išlaikom dienų eiliškumą).
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const visible = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.colorNumber ?? '').toLowerCase().includes(q) ||
            (r.sku ?? '').toLowerCase().includes(q)
        )
      : rows
    const byDate = new Map<string, Row[]>()
    for (const r of visible) {
      const arr = byDate.get(r.date) ?? []
      arr.push(r)
      byDate.set(r.date, arr)
    }
    return [...byDate.entries()].map(([date, items]) => ({ date, items }))
  }, [rows, filter])

  // ── Po sėkmingo grąžinimo — spausdinamas lapas ──
  if (state.returned) {
    const { rep, at, items } = state.returned
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
            + Naujas grąžinimas
          </button>
        </div>

        <div className="print-area max-w-3xl bg-white">
          <header className="border-b border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold">Prekių grąžinimo lapas</h1>
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
                <th className="py-2 pr-2 text-right w-[90px]">Grąžinta</th>
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
              Grąžino (parašas)
            </div>
            <div className="border-t border-gray-400 pt-1.5">
              Priėmė (parašas)
            </div>
          </div>

          <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
            Color SHOCK · Dažai Kirpėjams · Prekių grąžinimas iš vadybininkės
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
          onChange={(e) => changeRep(e.target.value)}
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

      {!repId ? (
        <div className="px-4 py-8 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
          Pasirinkite vadybininkę — prekės bus parodytos pagal išdavimo dieną.
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          Šiai vadybininkei nieko nebuvo išduota — nėra ką grąžinti.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-brand-gray-900 cursor-pointer">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => setAll(e.target.checked)}
                className="h-4 w-4 accent-brand-magenta cursor-pointer"
              />
              Pažymėti visas
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtruoti prekes…"
              className="w-full sm:w-64 px-3 py-2 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>

          {overProducts.size > 0 && (
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[13px]">
              Kai kurių prekių pažymėta grąžinti daugiau, nei vadybininkė šiuo metu
              turi (dalis jau parduota). Sumažinkite kiekį, kad galėtumėte priimti.
            </div>
          )}

          <div className="space-y-4">
            {groups.map((g) => (
              <div
                key={g.date}
                className="border border-[#eee] rounded-lg overflow-hidden"
              >
                <div className="bg-[#F9F9FB] px-3 py-2 text-[12px] font-semibold text-brand-gray-900 border-b border-[#eee] flex items-center justify-between">
                  <span>Išduota: {g.date}</span>
                  <span className="text-[11px] font-normal text-brand-gray-500">
                    {g.items.length} prekės
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-400">
                      <th className="px-3 py-1.5 text-center w-[44px]"></th>
                      <th className="px-3 py-1.5 text-left">Prekė</th>
                      <th className="px-3 py-1.5 text-center w-[80px]">Išduota</th>
                      <th className="px-3 py-1.5 text-center w-[120px]">Grąžinti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((r) => {
                      const over = overProducts.has(r.productId)
                      return (
                        <tr
                          key={r.key}
                          className={`border-t border-[#eee] ${r.checked ? 'bg-brand-magenta/[0.03]' : ''}`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={r.checked}
                              onChange={(e) => toggle(r.key, e.target.checked)}
                              className="h-4 w-4 accent-brand-magenta cursor-pointer"
                            />
                          </td>
                          <td
                            className="px-3 py-2 cursor-pointer"
                            onClick={() => toggle(r.key, !r.checked)}
                          >
                            <div className="font-medium text-brand-gray-900">
                              {r.colorNumber ? `${r.colorNumber} · ` : ''}
                              {r.name}
                            </div>
                            {r.sku && (
                              <div className="text-[11px] text-brand-gray-500 font-mono">
                                {r.sku}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-brand-gray-500">
                            {r.issued}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min={1}
                              max={r.issued}
                              step={1}
                              value={r.qty}
                              disabled={!r.checked}
                              onChange={(e) =>
                                setQty(r.key, parseInt(e.target.value, 10) || 1)
                              }
                              className={`w-20 px-2 py-1.5 border rounded-md text-sm text-center font-semibold disabled:bg-[#F5F5F7] disabled:text-brand-gray-400 ${
                                over && r.checked
                                  ? 'border-red-300 text-red-600 bg-red-50'
                                  : 'border-[#ddd] text-brand-gray-900'
                              }`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            {groups.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
                Pagal filtrą prekių nerasta.
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-brand-gray-500">
          Pažymėta prekių:{' '}
          <strong className="text-brand-gray-900">{selectedCount}</strong> · Iš
          viso vienetų:{' '}
          <strong className="text-brand-gray-900">{totalUnits}</strong>
        </div>
        <button
          type="submit"
          disabled={
            isPending ||
            selectedCount === 0 ||
            !repId ||
            overProducts.size > 0
          }
          className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Priimama…' : 'Priimti grąžinimą'}
        </button>
      </div>
      <p className="text-[12px] text-brand-gray-500">
        Pažymėtos prekės iš karto grąžinamos į sandėlį (viskas arba nieko),
        įrašoma į žurnalą, ir gausite spausdinamą grąžinimo lapą.
      </p>
    </form>
  )
}
