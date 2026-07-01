'use client'

import { useMemo, useState, useTransition } from 'react'
import { submitIssueRequest } from '../actions'
import type { RepIssueRequest } from '@/lib/rep/queries'

type Product = {
  id: string
  nameLt: string
  sku: string | null
  colorNumber: string | null
  stockQuantity: number
}

const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short', timeStyle: 'short' })

const STATUS: Record<RepIssueRequest['status'], { label: string; cls: string }> = {
  pending: { label: 'Laukia patvirtinimo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Patvirtinta', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Atmesta', cls: 'bg-red-50 text-red-700 border-red-200' },
}

export function IssueRequestFlow({
  products,
  requests,
}: {
  products: Product[]
  requests: RepIssueRequest[]
}) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [submitting, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([pid, q]) => ({ product: products.find((p) => p.id === pid)!, qty: q }))
        .filter((l) => l.product),
    [cart, products]
  )
  const totalUnits = lines.reduce((s, l) => s + l.qty, 0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? products.filter(
          (p) =>
            p.nameLt.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q)
        )
      : products
    return base.slice(0, 50)
  }, [products, search])

  function setQty(pid: string, q: number) {
    setCart((c) => ({ ...c, [pid]: Math.max(0, q) }))
  }

  function submit() {
    setError(null)
    const items = lines.map((l) => ({
      product_id: l.product.id,
      qty: l.qty,
      name: l.product.nameLt,
    }))
    if (!items.length) return setError('Pridėkite bent vieną prekę.')
    start(async () => {
      const res = await submitIssueRequest({ items })
      if (res.ok) {
        setCart({})
        setDone(true)
      } else setError(res.error)
    })
  }

  return (
    <div className="space-y-6">
      {done && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          ✅ Prašymas pateiktas. Administratoriui patvirtinus, prekės atsiras „Mano atsargos&quot;.
        </div>
      )}

      {/* Naujas prašymas */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 space-y-3">
        <h2 className="font-bold text-brand-gray-900">Naujas išvežimas</h2>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setDone(false)
          }}
          placeholder="🔍 Ieškoti prekės (pavadinimas, numeris, SKU)…"
          className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
        />
        {filtered.length > 0 && (
          <div className="border border-[#eee] rounded-lg divide-y divide-[#f3f3f3] max-h-60 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setQty(p.id, (cart[p.id] ?? 0) + 1)
                  setSearch('')
                }}
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

        {lines.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
            Sąrašas tuščias. Susiraskite prekes ir pridėkite, kiek norite pasiimti.
          </div>
        ) : (
          <div className="border border-[#eee] rounded-lg divide-y divide-[#f3f3f3]">
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-brand-gray-900 truncate">
                    {l.product.colorNumber ? `${l.product.colorNumber} · ` : ''}
                    {l.product.nameLt}
                  </div>
                  <div className="text-[11px] text-brand-gray-400">sandelyje {l.product.stockQuantity}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(l.product.id, l.qty - 1)}
                    className="w-7 h-7 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={l.qty}
                    onChange={(e) => setQty(l.product.id, parseInt(e.target.value || '0', 10))}
                    className="w-14 text-center px-1 py-1 bg-[#F5F5F7] border border-[#ddd] rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(l.product.id, l.qty + 1)}
                    className="w-7 h-7 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setQty(l.product.id, 0)}
                    title="Pašalinti"
                    className="ml-1 text-brand-gray-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-brand-gray-500">
            Iš viso vienetų: <strong className="text-brand-gray-900">{totalUnits}</strong>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || lines.length === 0}
            className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Pateikiama…' : 'Pateikti prašymą'}
          </button>
        </div>
      </div>

      {/* Mano prašymai */}
      <div>
        <h2 className="font-bold text-brand-gray-900 mb-2">Mano prašymai</h2>
        {requests.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-brand-gray-500 bg-white border border-[#eee] rounded-xl">
            Prašymų dar nėra.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const st = STATUS[r.status]
              const units = r.items.reduce((s, i) => s + i.qty, 0)
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[12px] text-brand-gray-500">
                      {DATE.format(new Date(r.createdAt))} · {units} vnt.
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  {r.status === 'rejected' && r.rejectReason && (
                    <div className="mt-2 text-[13px] text-red-700">Priežastis: {r.rejectReason}</div>
                  )}
                  <ul className="mt-2 text-[13px] text-brand-gray-700 space-y-0.5">
                    {r.items.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="truncate">{i.name}</span>
                        <span className="text-brand-gray-500 whitespace-nowrap">× {i.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
