'use client'

import { useState, useMemo, useRef } from 'react'
import { consumeOwnUseAction } from '../actions'
import type { AdminProductListRow } from '@/lib/admin/queries'
import {
  ScanResultBanner,
  playScanFeedback,
  type ScanResult,
} from '@/components/admin/ScanFeedback'

type LogEntry =
  | { id: number; kind: 'ok'; name: string; removed: number; stock: number }
  | { id: number; kind: 'error'; message: string }

export function OwnUseForm({ products }: { products: AdminProductListRow[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [qty, setQty] = useState(1)
  const [manualSearch, setManualSearch] = useState('')
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const idRef = useRef(0)
  const queueRef = useRef<Array<{ product: AdminProductListRow; qty: number }>>([])
  const processingRef = useRef(false)

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

  async function processQueue() {
    if (processingRef.current) return
    processingRef.current = true
    setBusy(true)
    try {
      while (queueRef.current.length > 0) {
        const job = queueRef.current.shift()!
        const id = ++idRef.current
        const res = await consumeOwnUseAction(job.product.id, job.qty)
        if (res.ok) {
          playScanFeedback('ok')
          setLastScan({
            id,
            outcome: 'ok',
            title: `${job.product.colorNumber ? `${job.product.colorNumber} · ` : ''}${job.product.nameLt}`,
            subtitle: `Sunaudota ${res.removed} · likutis ${res.stock}`,
          })
          setLog((l) => [
            { id, kind: 'ok', name: job.product.nameLt, removed: res.removed, stock: res.stock },
            ...l,
          ])
        } else {
          playScanFeedback('fail')
          setLastScan({ id, outcome: 'fail', title: 'Nepavyko', subtitle: res.error })
          setLog((l) => [{ id, kind: 'error', message: res.error }, ...l])
        }
      }
    } finally {
      processingRef.current = false
      setBusy(false)
    }
  }

  function enqueue(product: AdminProductListRow, n: number) {
    queueRef.current.push({ product, qty: n })
    void processQueue()
  }

  function onScanSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
    if (!val) return
    const p = products.find((pp) => pp.ean && pp.ean === val)
    if (!p) {
      const id = ++idRef.current
      playScanFeedback('fail')
      setLastScan({ id, outcome: 'fail', title: 'Prekė nerasta', subtitle: `EAN: ${val}` })
      return
    }
    enqueue(p, qty)
  }

  const totalUnits = log.reduce((s, l) => s + (l.kind === 'ok' ? l.removed : 0), 0)
  const okCount = log.filter((l) => l.kind === 'ok').length

  return (
    <div className="space-y-5">
      <form
        onSubmit={onScanSubmit}
        className="bg-white rounded-xl border border-[#eee] p-5 space-y-4"
      >
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
              Kiekis už skaną
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setQty((q) => Math.max(1, q - 1)); inputRef.current?.focus() }}
                className="w-9 h-9 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
              >−</button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-16 text-center px-2 py-2 bg-[#F5F5F7] border border-[#ddd] rounded-md text-base"
              />
              <button
                type="button"
                onClick={() => { setQty((q) => q + 1); inputRef.current?.focus() }}
                className="w-9 h-9 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
              >+</button>
            </div>
          </div>
          <div className="flex-1 min-w-[160px] px-3 py-2 rounded-lg text-sm font-semibold text-center bg-[#F5F5F7] text-brand-gray-600">
            Kiekvienas skanas nurašo savo naudojimui: −{qty}
          </div>
        </div>

        <div>
          <label htmlFor="ownuse-scan" className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
            Nuskenuokite barkodą {busy && <span className="text-brand-magenta">· apdorojama…</span>}
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="ownuse-scan"
              autoComplete="off"
              autoFocus
              placeholder="Nukreipkite skanerį čia…"
              className="flex-1 px-4 py-3 bg-[#F5F5F7] border-2 border-brand-magenta rounded-lg text-base focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark whitespace-nowrap"
            >
              Sunaudoti
            </button>
          </div>
          <ScanResultBanner result={lastScan} />
          <p className="mt-2 text-[12px] text-brand-gray-500">
            Skenuokite kiekvieną prekę, kurią Džiuljeta paima darbui. Iš karto
            nurašoma iš sandėlio ir žymima atskirai — savo naudojimui (ataskaitai).
          </p>
        </div>
      </form>

      {/* Rankinis (be barkodo) */}
      <div className="bg-white rounded-xl border border-[#eee] p-5 space-y-2">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Rasti prekę be barkodo — nurašys −{qty}
        </label>
        <input
          value={manualSearch}
          onChange={(e) => setManualSearch(e.target.value)}
          placeholder="pvz. 6.8 Color SHOCK arba CS-68…"
          className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
        />
        {manualResults.length > 0 && (
          <div className="border border-[#eee] rounded-lg divide-y divide-[#f3f3f3] overflow-hidden">
            {manualResults.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={busy}
                onClick={() => { enqueue(p, qty); setManualSearch('') }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left disabled:opacity-50"
              >
                <span className="text-brand-gray-900">
                  {p.colorNumber ? `${p.colorNumber} · ` : ''}{p.nameLt}
                </span>
                <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">likutis {p.stockQuantity}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-brand-gray-900">
          Sunaudota: {okCount} įrašai · {totalUnits} vnt.
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

      <div className="bg-white rounded-xl border border-[#eee] divide-y divide-[#f3f3f3] overflow-hidden">
        {log.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-brand-gray-400">
            Dar nieko nesunaudota.
          </div>
        ) : (
          log.map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              {e.kind === 'ok' ? (
                <>
                  <div className="text-sm font-medium text-brand-gray-900 truncate">{e.name}</div>
                  <div className="text-right whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      −{e.removed}
                    </span>
                    <div className="text-[12px] text-brand-gray-500 mt-0.5">likutis: {e.stock}</div>
                  </div>
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
