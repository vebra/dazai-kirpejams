'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { receiveScannedItem, receiveManualItem } from '../actions'
import type { AdminProductListRow } from '@/lib/admin/queries'
import {
  ScanResultBanner,
  playScanFeedback,
  type ScanResult,
} from '@/components/admin/ScanFeedback'

type LogEntry =
  | { id: number; kind: 'ok'; name: string; sku: string | null; stock: number; added: number }
  | { id: number; kind: 'notfound'; ean: string }
  | { id: number; kind: 'error'; message: string }

/** Dvigubo skano langas (ms): tas pats EAN per šį laiką → įspėjimas. */
const DUP_WINDOW_MS = 2500

export function ReceivingScanner({ products }: { products: AdminProductListRow[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [qty, setQty] = useState(1)
  const [supplier, setSupplier] = useState('')
  const [manualSearch, setManualSearch] = useState('')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const idRef = useRef(0)
  // Dvigubo skano aptikimas — paskutinis EAN ir laikas.
  const lastEanRef = useRef<{ ean: string; at: number } | null>(null)

  const manualResults = useMemo(() => {
    const q = manualSearch.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.nameLt.toLowerCase().includes(q) ||
          (p.colorNumber ?? '').toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.ean ?? '').includes(q)
      )
      .slice(0, 8)
  }, [products, manualSearch])

  async function receiveManual(p: AdminProductListRow) {
    const id = ++idRef.current
    setBusy(true)
    try {
      const res = await receiveManualItem(p.id, qty, supplier)
      if (res.ok) {
        playScanFeedback('ok')
        setLastResult({
          id,
          outcome: 'ok',
          title: `${res.name} · naujas likutis ${res.stock}`,
          subtitle: `Pridėta +${res.added}${res.sku ? ` · ${res.sku}` : ''}`,
        })
        setLog((l) => [
          { id, kind: 'ok', name: res.name, sku: res.sku, stock: res.stock, added: res.added },
          ...l,
        ])
        setManualSearch('')
      } else {
        playScanFeedback('fail')
        setLastResult({ id, outcome: 'fail', title: 'Nepavyko priimti', subtitle: res.error })
        setLog((l) => [{ id, kind: 'error', message: res.error }, ...l])
      }
    } finally {
      setBusy(false)
    }
  }
  const queueRef = useRef<Array<{ ean: string; qty: number }>>([])
  const processingRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function focusScan() {
    inputRef.current?.focus()
  }

  async function processQueue() {
    if (processingRef.current) return
    processingRef.current = true
    setBusy(true)
    try {
      while (queueRef.current.length > 0) {
        const job = queueRef.current.shift()!
        const id = ++idRef.current
        try {
          const res = await receiveScannedItem(job.ean, job.qty)
          if (res.ok && res.found) {
            // Dvigubo skano patikra: tas pats EAN per DUP_WINDOW_MS → įspėjam.
            const now = Date.now()
            const prev = lastEanRef.current
            const isDup =
              prev !== null && prev.ean === job.ean && now - prev.at < DUP_WINDOW_MS
            lastEanRef.current = { ean: job.ean, at: now }
            playScanFeedback(isDup ? 'warn' : 'ok')
            setLastResult({
              id,
              outcome: isDup ? 'warn' : 'ok',
              title: `${res.name} · naujas likutis ${res.stock}`,
              subtitle: isDup
                ? `⚠ Tas pats barkodas dar kartą — pridėta +${res.added}. Ar tikrai?`
                : `Pridėta +${res.added}${res.sku ? ` · ${res.sku}` : ''}`,
            })
            setLog((l) => [
              { id, kind: 'ok', name: res.name, sku: res.sku, stock: res.stock, added: res.added },
              ...l,
            ])
          } else if (res.ok && !res.found) {
            lastEanRef.current = null
            playScanFeedback('fail')
            setLastResult({
              id,
              outcome: 'fail',
              title: 'Prekė nerasta',
              subtitle: `EAN: ${res.ean} — sukurkite prekę`,
            })
            setLog((l) => [{ id, kind: 'notfound', ean: res.ean }, ...l])
          } else {
            lastEanRef.current = null
            playScanFeedback('fail')
            setLastResult({ id, outcome: 'fail', title: 'Klaida', subtitle: res.error })
            setLog((l) => [{ id, kind: 'error', message: res.error }, ...l])
          }
        } catch (err) {
          lastEanRef.current = null
          const message = err instanceof Error ? err.message : 'Nenumatyta klaida'
          playScanFeedback('fail')
          setLastResult({ id, outcome: 'fail', title: 'Klaida', subtitle: message })
          setLog((l) => [{ id, kind: 'error', message }, ...l])
        }
      }
    } finally {
      processingRef.current = false
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    if (inputRef.current) inputRef.current.value = ''
    focusScan()
    if (!val) return
    queueRef.current.push({ ean: val, qty })
    void processQueue()
  }

  const okCount = log.filter((l) => l.kind === 'ok').length
  const unitsAdded = log.reduce((s, l) => s + (l.kind === 'ok' ? l.added : 0), 0)

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4"
      >
        {/* Kiekis už skaną */}
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label htmlFor="qty" className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
              Kiekis už skaną
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setQty((q) => Math.max(1, q - 1)); focusScan() }}
                className="w-9 h-9 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
              >−</button>
              <input
                id="qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusScan() } }}
                className="w-16 text-center px-2 py-2 bg-[#F5F5F7] border border-[#ddd] rounded-md text-base"
              />
              <button
                type="button"
                onClick={() => { setQty((q) => q + 1); focusScan() }}
                className="w-9 h-9 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
              >+</button>
              {qty !== 1 && (
                <button
                  type="button"
                  onClick={() => { setQty(1); focusScan() }}
                  className="ml-1 px-2.5 py-2 rounded-md border border-[#ddd] text-[12px] font-semibold text-brand-gray-600 hover:bg-[#F5F5F7]"
                >↺ 1</button>
              )}
            </div>
          </div>
          <div
            className={`flex-1 min-w-[160px] px-3 py-2 rounded-lg text-sm font-semibold text-center ${
              qty === 1
                ? 'bg-[#F5F5F7] text-brand-gray-600'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Kiekvienas skanas: +{qty}
          </div>
        </div>

        {/* Skanavimo laukas */}
        <div>
          <label htmlFor="scan" className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
            Nuskenuokite barkodą {busy && <span className="text-brand-magenta">· apdorojama…</span>}
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="scan"
              autoComplete="off"
              autoFocus
              placeholder="Nukreipkite skanerį čia ir skenuokite…"
              className="flex-1 px-4 py-3 bg-[#F5F5F7] border-2 border-brand-magenta rounded-lg text-base focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
            >
              Pridėti
            </button>
          </div>
          <p className="mt-2 text-[12px] text-brand-gray-500">
            Skaneris prideda <strong>+{qty}</strong> prie likučio pagal barkodą (EAN). Dėžėms —
            nustatykite kiekį (pvz. 24) ir nuskenuokite vieną kartą. Singliniams — palikite 1.
          </p>
        </div>

        {/* Didelis paskutinio skano patvirtinimas — iš kart prie lauko */}
        <ScanResultBanner result={lastResult} />
      </form>

      {/* Rankinis priėmimas (prekėms be barkodo) + tiekėjas */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-3">
        <h3 className="text-sm font-bold text-brand-gray-900">
          Rankinis priėmimas (be barkodo)
        </h3>
        <div>
          <label
            htmlFor="supplier"
            className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
          >
            Tiekėjas (neprivaloma)
          </label>
          <input
            id="supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="pvz. RosaNera"
            className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
        </div>
        <div>
          <label
            htmlFor="manual-search"
            className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
          >
            Rasti prekę (pavadinimas, numeris, SKU) — pridės +{qty}
          </label>
          <input
            id="manual-search"
            value={manualSearch}
            onChange={(e) => setManualSearch(e.target.value)}
            placeholder="pvz. Oksidantas 6% arba OX-6…"
            className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
          {manualResults.length > 0 && (
            <div className="mt-2 border border-[#eee] rounded-lg divide-y divide-[#f3f3f3] overflow-hidden">
              {manualResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() => receiveManual(p)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left disabled:opacity-50"
                >
                  <span className="text-brand-gray-900">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameLt}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-magenta text-white whitespace-nowrap">
                    +{qty}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-brand-gray-900">
          Priimta: {okCount} skan. · {unitsAdded} vnt.
        </h3>
        {log.length > 0 && (
          <button
            onClick={() => setLog([])}
            className="text-[12px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            Išvalyti žurnalą
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] divide-y divide-[#f3f3f3] overflow-hidden">
        {log.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-brand-gray-400">
            Dar nieko nenuskenuota.
          </div>
        ) : (
          log.map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              {e.kind === 'ok' ? (
                <>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-brand-gray-900 truncate">{e.name}</div>
                    {e.sku && <div className="text-[11px] text-brand-gray-400 font-mono">{e.sku}</div>}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +{e.added}
                    </span>
                    <div className="text-[12px] text-brand-gray-500 mt-0.5">likutis: {e.stock}</div>
                  </div>
                </>
              ) : e.kind === 'notfound' ? (
                <>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-red-700">Prekė nerasta</div>
                    <div className="text-[11px] text-brand-gray-500 font-mono">EAN: {e.ean}</div>
                  </div>
                  <Link
                    href={`/admin/sandelis/naujas`}
                    className="px-3 py-1.5 bg-brand-magenta text-white rounded-md text-[12px] font-semibold whitespace-nowrap hover:bg-brand-magenta-dark"
                  >
                    + Sukurti
                  </Link>
                </>
              ) : (
                <div className="text-sm text-red-700">{e.message}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
