'use client'

import { useEffect, useRef, useState } from 'react'
import {
  receiveOrderItemAction,
  receiveAllRemainingAction,
  setOrderItemReceivedAction,
  type SupplierOrderStatus,
} from '../../../actions'
import {
  ScanResultBanner,
  playScanFeedback,
  type ScanResult,
} from '@/components/admin/ScanFeedback'

export type ReceiveItem = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  ean: string | null
  qty: number
  received: number
}

const STATUS_BADGE: Record<SupplierOrderStatus, { label: string; cls: string }> = {
  ordered: { label: 'Laukiama', cls: 'bg-[#F5F5F7] text-brand-gray-600 border-[#ddd]' },
  partial: { label: 'Gauta dalinai', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  received: { label: 'Gauta pilnai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

function computeStatus(items: ReceiveItem[]): SupplierOrderStatus {
  const total = items.reduce((s, i) => s + i.received, 0)
  if (total === 0) return 'ordered'
  return items.every((i) => i.received >= i.qty) ? 'received' : 'partial'
}

export function ReceiveOrderClient({
  orderId,
  initialItems,
}: {
  orderId: string
  initialItems: ReceiveItem[]
}) {
  const [items, setItems] = useState<ReceiveItem[]>(initialItems)
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [allBusy, setAllBusy] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)
  const queueRef = useRef<string[]>([])
  const processingRef = useRef(false)
  // Naujausią items kopiją laikom ref'e — kad eilės apdorojimas matytų pokyčius.
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function focusScan() {
    inputRef.current?.focus()
  }

  const status = computeStatus(items)
  const positionsFull = items.filter((i) => i.received >= i.qty).length
  const totalOrdered = items.reduce((s, i) => s + i.qty, 0)
  const totalReceived = items.reduce((s, i) => s + i.received, 0)
  const allDone = items.length > 0 && items.every((i) => i.received >= i.qty)

  function applyResult(productId: string, received: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, received } : i))
    )
  }

  async function receive(productId: string, delta: number) {
    if (delta <= 0) return
    setBusy(true)
    const id = ++idRef.current
    try {
      const res = await receiveOrderItemAction(orderId, productId, delta)
      if (res.ok) {
        applyResult(res.productId, res.received)
        const over = res.received > res.qty
        playScanFeedback(over ? 'warn' : 'ok')
        setLastResult({
          id,
          outcome: over ? 'warn' : 'ok',
          title: `${res.name} · gauta ${res.received}/${res.qty}`,
          subtitle: over
            ? `⚠ Gauta daugiau nei užsakyta. Likutis: ${res.stock}`
            : `Pridėta +${delta} · likutis: ${res.stock}`,
        })
      } else {
        playScanFeedback('fail')
        setLastResult({ id, outcome: 'fail', title: 'Nepavyko', subtitle: res.error })
      }
    } finally {
      setBusy(false)
    }
  }

  async function processQueue() {
    if (processingRef.current) return
    processingRef.current = true
    setBusy(true)
    try {
      while (queueRef.current.length > 0) {
        const ean = queueRef.current.shift()!
        const id = ++idRef.current
        const match = itemsRef.current.find(
          (i) => i.ean && i.ean.trim() === ean
        )
        if (!match) {
          playScanFeedback('fail')
          setLastResult({
            id,
            outcome: 'fail',
            title: 'Nėra šiame užsakyme',
            subtitle: `EAN: ${ean}`,
          })
          continue
        }
        const res = await receiveOrderItemAction(orderId, match.productId, qty)
        if (res.ok) {
          applyResult(res.productId, res.received)
          const over = res.received > res.qty
          playScanFeedback(over ? 'warn' : 'ok')
          setLastResult({
            id,
            outcome: over ? 'warn' : 'ok',
            title: `${res.name} · gauta ${res.received}/${res.qty}`,
            subtitle: over
              ? `⚠ Gauta daugiau nei užsakyta. Likutis: ${res.stock}`
              : `Pridėta +${qty} · likutis: ${res.stock}`,
          })
        } else {
          playScanFeedback('fail')
          setLastResult({ id, outcome: 'fail', title: 'Klaida', subtitle: res.error })
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
    queueRef.current.push(val)
    void processQueue()
  }

  async function receiveAll() {
    if (allBusy) return
    if (!confirm('Pažymėti visas likusias prekes kaip gautas ir pridėti jas prie likučio?')) {
      return
    }
    setAllBusy(true)
    const id = ++idRef.current
    try {
      const res = await receiveAllRemainingAction(orderId)
      if (res.ok) {
        setItems((prev) => prev.map((i) => ({ ...i, received: Math.max(i.received, i.qty) })))
        playScanFeedback('ok')
        setLastResult({
          id,
          outcome: 'ok',
          title: 'Užsakymas priimtas',
          subtitle: `Pridėta ${res.receivedUnits} vnt. (${res.itemsTouched} prek.)`,
        })
      } else {
        playScanFeedback('fail')
        setLastResult({ id, outcome: 'fail', title: 'Nepavyko', subtitle: res.error })
      }
    } finally {
      setAllBusy(false)
    }
  }

  async function resetRow(productId: string) {
    const id = ++idRef.current
    const res = await setOrderItemReceivedAction(orderId, productId, 0)
    if (res.ok) {
      applyResult(productId, 0)
    } else {
      playScanFeedback('fail')
      setLastResult({ id, outcome: 'fail', title: 'Nepavyko', subtitle: res.error })
    }
  }

  const badge = STATUS_BADGE[status]

  return (
    <div className="space-y-5">
      {/* Suvestinė / būsena */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold border ${badge.cls}`}
            >
              {badge.label}
            </span>
            <span className="text-sm text-brand-gray-600">
              Pozicijos: <strong className="tabular-nums">{positionsFull}/{items.length}</strong>{' '}
              · Vnt.:{' '}
              <strong className="tabular-nums">
                {totalReceived}/{totalOrdered}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={receiveAll}
            disabled={allBusy || allDone}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {allDone ? '✓ Viskas gauta' : allBusy ? 'Priimama…' : '✓ Pažymėti viską gauta'}
          </button>
        </div>
        {/* Progreso juosta */}
        <div className="mt-3 h-2 rounded-full bg-[#F0F0F2] overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{
              width: `${totalOrdered > 0 ? Math.min(100, (totalReceived / totalOrdered) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Skenavimas */}
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4"
      >
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label
              htmlFor="qty"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
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

        <div>
          <label
            htmlFor="scan"
            className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
          >
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
              Priimti
            </button>
          </div>
          <p className="mt-2 text-[12px] text-brand-gray-500">
            Skenuojama prekė „nubraukiama“ nuo užsakymo ir pridedama prie likučio.
            Jei prekės nėra šiame užsakyme — gausite įspėjimą.
          </p>
        </div>

        <ScanResultBanner result={lastResult} />
      </form>

      {/* Prekių lentelė: užsakyta / gauta / trūksta */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-4 py-2.5 text-left">Prekė</th>
                <th className="px-3 py-2.5 text-center w-[80px]">Užsakyta</th>
                <th className="px-3 py-2.5 text-center w-[80px]">Gauta</th>
                <th className="px-3 py-2.5 text-center w-[80px]">Trūksta</th>
                <th className="px-3 py-2.5 text-right w-[200px]">Priimti</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const remaining = Math.max(0, it.qty - it.received)
                const full = it.received >= it.qty
                const over = it.received > it.qty
                return (
                  <tr
                    key={it.productId}
                    className={`border-t border-[#eee] ${full ? 'bg-emerald-50/40' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-brand-gray-900">
                      <div className="font-medium">
                        {it.colorNumber ? `${it.colorNumber} · ` : ''}
                        {it.name}
                      </div>
                      {(it.sku || it.ean) && (
                        <div className="text-[11px] text-brand-gray-400 font-mono">
                          {it.sku ?? it.ean}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-brand-gray-900">
                      {it.qty}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-center tabular-nums font-bold ${
                        over
                          ? 'text-amber-700'
                          : full
                            ? 'text-emerald-700'
                            : it.received > 0
                              ? 'text-brand-gray-900'
                              : 'text-brand-gray-400'
                      }`}
                    >
                      {it.received}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-center tabular-nums font-semibold ${
                        remaining > 0 ? 'text-red-600' : 'text-brand-gray-300'
                      }`}
                    >
                      {remaining > 0 ? remaining : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {full ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Gauta
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => receive(it.productId, qty)}
                              className="px-2.5 py-1.5 bg-white border border-[#ddd] text-brand-gray-700 rounded-md text-[12px] font-semibold hover:bg-[#F5F5F7] disabled:opacity-50"
                            >
                              +{qty}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => receive(it.productId, remaining)}
                              className="px-2.5 py-1.5 bg-brand-magenta text-white rounded-md text-[12px] font-semibold hover:bg-brand-magenta-dark disabled:opacity-50 whitespace-nowrap"
                            >
                              Viskas
                            </button>
                          </>
                        )}
                        {it.received > 0 && (
                          <button
                            type="button"
                            onClick={() => resetRow(it.productId)}
                            title="Atstatyti žymą į 0 (likučio nekeičia)"
                            className="px-2 py-1.5 text-brand-gray-400 rounded-md text-[12px] hover:bg-[#F5F5F7] hover:text-brand-gray-600"
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[12px] text-brand-gray-400">
        „↺“ atstato gautos žymą į 0 — likučio nekeičia. Jei perskenavote ir likutis
        per didelis, pataisykite per <strong>Reviziją</strong>.
      </p>
    </div>
  )
}
