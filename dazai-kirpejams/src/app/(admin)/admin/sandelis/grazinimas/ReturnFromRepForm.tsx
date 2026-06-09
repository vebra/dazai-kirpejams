'use client'

import { useState, useMemo, useActionState } from 'react'
import {
  returnStockBatchFromRepAction,
  type ReturnBatchState,
} from '../actions'
import type { RepHeldItem } from '@/lib/admin/rep-reports'

const initialState: ReturnBatchState = {}

type Rep = { id: string; name: string }

type Line = {
  id: string
  name: string
  colorNumber: string | null
  sku: string | null
  held: number
  qty: number
}

const DATE_FMT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function ReturnFromRepForm({
  reps,
  heldByRep,
}: {
  reps: Rep[]
  heldByRep: Record<string, RepHeldItem[]>
}) {
  const [state, formAction, isPending] = useActionState(
    returnStockBatchFromRepAction,
    initialState
  )
  const [search, setSearch] = useState('')
  const [repId, setRepId] = useState('')
  const [list, setList] = useState<Line[]>([])
  const repName = reps.find((r) => r.id === repId)?.name ?? ''

  const held = useMemo(() => heldByRep[repId] ?? [], [heldByRep, repId])

  const results = useMemo(() => {
    if (!repId) return []
    const q = search.trim().toLowerCase()
    if (!q) return []
    const inList = new Set(list.map((l) => l.id))
    return held
      .filter(
        (p) =>
          !inList.has(p.productId) &&
          (p.name.toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [held, search, list, repId])

  const itemsJson = JSON.stringify(
    list.map((l) => ({ product_id: l.id, qty: l.qty }))
  )
  const totalUnits = list.reduce((s, l) => s + l.qty, 0)

  function changeRep(id: string) {
    setRepId(id)
    setList([]) // skirtingos vadybininkės — kitos turimos prekės
    setSearch('')
  }

  function addProduct(p: RepHeldItem) {
    setList((prev) =>
      prev.some((l) => l.id === p.productId)
        ? prev
        : [
            ...prev,
            {
              id: p.productId,
              name: p.name,
              colorNumber: p.colorNumber,
              sku: p.sku,
              held: p.held,
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

  function remove(id: string) {
    setList((prev) => prev.filter((l) => l.id !== id))
  }

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

      {repId && held.length === 0 ? (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          Šiai vadybininkei nėra išduotų prekių — nėra ką grąžinti.
        </div>
      ) : (
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
            Pridėti prekę į sąrašą
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              repId
                ? 'Ieškoti tarp turimų prekių (pavadinimas, numeris, SKU)…'
                : 'Pirma pasirinkite vadybininkę'
            }
            disabled={!repId}
            className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta disabled:bg-[#F5F5F7] disabled:text-brand-gray-400"
          />
          {results.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
              {results.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left"
                >
                  <span className="text-brand-gray-900">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.name}
                  </span>
                  <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">
                    turi {p.held}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sąrašas */}
      {list.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
          Sąrašas tuščias. Susiraskite prekes, kurias vadybininkė grąžina.
        </div>
      ) : (
        <div className="border border-[#eee] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-3 py-2 text-left">Prekė</th>
                <th className="px-3 py-2 text-center w-[90px]">Turi</th>
                <th className="px-3 py-2 text-center w-[120px]">Grąžina</th>
                <th className="px-3 py-2 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const over = l.qty > l.held
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
                      {l.held}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        max={l.held}
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
                          turi tik {l.held}
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
          disabled={
            isPending ||
            list.length === 0 ||
            !repId ||
            list.some((l) => l.qty > l.held)
          }
          className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Priimama…' : 'Priimti grąžinimą'}
        </button>
      </div>
      <p className="text-[12px] text-brand-gray-500">
        Pateikus, visos prekės iš karto grąžinamos į sandėlį (viskas arba nieko),
        įrašoma į žurnalą, ir gausite spausdinamą grąžinimo lapą.
      </p>
    </form>
  )
}
