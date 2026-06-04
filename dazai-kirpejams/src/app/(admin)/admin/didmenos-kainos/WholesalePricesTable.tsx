'use client'

import { useMemo, useState, useTransition } from 'react'
import type { AdminWholesaleRow } from '@/lib/admin/queries'
import { setWholesalePrices } from './actions'

const TIERS = ['wholesale_1', 'wholesale_2', 'wholesale_3'] as const
type Tier = (typeof TIERS)[number]
const TIER_HEAD: Record<Tier, string> = {
  wholesale_1: 'Didmena I',
  wholesale_2: 'Didmena II',
  wholesale_3: 'Didmena III',
}

const eur = (cents: number) => (cents / 100).toFixed(2)

/** "6,90" | "6.90" | "" → centai arba null (tuščia). undefined = netinkama reikšmė. */
function parseEur(raw: string): number | null | undefined {
  const s = raw.trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n * 100)
}

export function WholesalePricesTable({ rows }: { rows: AdminWholesaleRow[] }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.nameLt.toLowerCase().includes(q) ||
        (r.sku ?? '').toLowerCase().includes(q) ||
        (r.colorNumber ?? '').toLowerCase().includes(q)
    )
  }, [rows, query])

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Ieškoti prekės (pavadinimas, SKU, spalvos nr.)…"
        className="w-full sm:max-w-md px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
      />

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              <th className="px-4 py-3 text-left">Prekė</th>
              <th className="px-4 py-3 text-right w-[90px]">Retail</th>
              {TIERS.map((t) => (
                <th key={t} className="px-3 py-3 text-center w-[120px]">{TIER_HEAD[t]}</th>
              ))}
              <th className="px-4 py-3 text-right w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <PriceRow key={r.id} row={r} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brand-gray-400">
                  Prekių nerasta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PriceRow({ row }: { row: AdminWholesaleRow }) {
  const initial = (t: Tier) => (row.prices[t] != null ? eur(row.prices[t]) : '')
  const [vals, setVals] = useState<Record<Tier, string>>({
    wholesale_1: initial('wholesale_1'),
    wholesale_2: initial('wholesale_2'),
    wholesale_3: initial('wholesale_3'),
  })
  const [pending, start] = useTransition()
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  function set(t: Tier, v: string) {
    setVals((s) => ({ ...s, [t]: v }))
    setStatus('idle')
  }

  function save() {
    setMsg(null)
    const parsed: Record<Tier, number | null> = {
      wholesale_1: null,
      wholesale_2: null,
      wholesale_3: null,
    }
    for (const t of TIERS) {
      const p = parseEur(vals[t])
      if (p === undefined) {
        setStatus('error')
        setMsg(`${TIER_HEAD[t]}: netinkama kaina`)
        return
      }
      parsed[t] = p
    }
    start(async () => {
      const res = await setWholesalePrices(row.id, parsed)
      if (res.ok) {
        setStatus('saved')
        setMsg(null)
      } else {
        setStatus('error')
        setMsg(res.error ?? 'Klaida')
      }
    })
  }

  return (
    <tr className="border-t border-[#eee] hover:bg-[#F9F9FB]">
      <td className="px-4 py-2.5">
        <div className="font-medium text-brand-gray-900">{row.nameLt}</div>
        {row.sku && <div className="text-[11px] text-brand-gray-400 font-mono">{row.sku}</div>}
      </td>
      <td className="px-4 py-2.5 text-right text-brand-gray-400">{eur(row.retailCents)} €</td>
      {TIERS.map((t) => (
        <td key={t} className="px-3 py-2.5 text-center">
          <input
            value={vals[t]}
            onChange={(e) => set(t, e.target.value)}
            inputMode="decimal"
            placeholder="—"
            className="w-[84px] px-2 py-1.5 text-right bg-[#F5F5F7] border border-[#ddd] rounded-md text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
        </td>
      ))}
      <td className="px-4 py-2.5 text-right">
        <button
          onClick={save}
          disabled={pending}
          className="px-3 py-1.5 bg-brand-magenta text-white rounded-md text-[12px] font-semibold hover:bg-brand-magenta-dark transition-colors disabled:opacity-50"
        >
          {pending ? '…' : status === 'saved' ? '✓ Įrašyta' : 'Išsaugoti'}
        </button>
        {status === 'error' && msg && (
          <div className="text-[11px] text-red-600 mt-1 whitespace-nowrap">{msg}</div>
        )}
      </td>
    </tr>
  )
}
