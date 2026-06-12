'use client'

import { useMemo, useState } from 'react'
import { Search, Package, ChevronDown } from 'lucide-react'
import type { RepStockSummaryRow, RepStockMovementRow } from '@/lib/rep/queries'

const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short' })
const DATE_TIME = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const REASON_LABELS: Record<
  RepStockMovementRow['reason'],
  { label: string; sign: '+' | '−'; cls: string }
> = {
  issue_to_rep: {
    label: 'Išduota iš sandėlio',
    sign: '+',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  return_from_rep: {
    label: 'Grąžinta į sandėlį',
    sign: '−',
    cls: 'bg-amber-50 text-amber-700',
  },
  rep_sale: {
    label: 'Parduota klientui',
    sign: '−',
    cls: 'bg-blue-50 text-blue-700',
  },
  rep_sale_cancel: {
    label: 'Pardavimas atšauktas',
    sign: '+',
    cls: 'bg-gray-100 text-gray-600',
  },
}

type Tab = 'turimos' | 'visos' | 'istorija'

export function AtsargosView({
  summary,
  movements,
}: {
  summary: RepStockSummaryRow[]
  movements: RepStockMovementRow[]
}) {
  const [tab, setTab] = useState<Tab>('turimos')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const totals = useMemo(
    () =>
      summary.reduce(
        (t, r) => ({
          taken: t.taken + r.taken,
          returned: t.returned + r.returned,
          sold: t.sold + r.sold,
          onHand: t.onHand + r.onHand,
        }),
        { taken: 0, returned: 0, sold: 0, onHand: 0 }
      ),
    [summary]
  )

  const movementsByProduct = useMemo(() => {
    const map = new Map<string, RepStockMovementRow[]>()
    for (const m of movements) {
      const list = map.get(m.productId) ?? []
      list.push(m)
      map.set(m.productId, list)
    }
    return map
  }, [movements])

  const onHandRows = useMemo(() => summary.filter((r) => r.onHand > 0), [summary])

  const q = query.trim().toLowerCase()
  const filterRows = (rows: RepStockSummaryRow[]) =>
    q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.colorNumber ?? '').toLowerCase().includes(q) ||
            (r.sku ?? '').toLowerCase().includes(q)
        )
      : rows

  const filteredMovements = q
    ? movements.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.colorNumber ?? '').toLowerCase().includes(q) ||
          (m.source ?? '').toLowerCase().includes(q)
      )
    : movements

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'turimos', label: `Turimos (${onHandRows.length})` },
    { key: 'visos', label: `Visos (${summary.length})` },
    { key: 'istorija', label: 'Istorija' },
  ]

  const visibleRows = filterRows(tab === 'turimos' ? onHandRows : summary)

  return (
    <div className="space-y-5">
      {/* Santraukos kortelės */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Turite dabar" value={`${totals.onHand} vnt.`} accent />
        <StatCard label="Paimta iš viso" value={`${totals.taken} vnt.`} />
        <StatCard label="Parduota" value={`${totals.sold} vnt.`} />
        <StatCard label="Grąžinta" value={`${totals.returned} vnt.`} />
      </div>

      {/* Paieška + skirtukai */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ieškoti prekės ar numerio…"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#ddd] rounded-xl text-sm focus:outline-none focus:border-brand-magenta"
          />
        </div>
        <div className="flex p-1 bg-white border border-[#eee] rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-brand-magenta text-white'
                  : 'text-brand-gray-600 hover:bg-[#F5F5F7]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Turinys */}
      {tab !== 'istorija' ? (
        visibleRows.length === 0 ? (
          <EmptyState
            text={
              q
                ? 'Pagal paiešką nieko nerasta.'
                : tab === 'turimos'
                  ? 'Šiuo metu prekių neturite. Visa istorija — skirtuke „Visos".'
                  : 'Jums dar nieko neišduota iš sandėlio.'
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <ul className="divide-y divide-[#f3f3f3]">
              {visibleRows.map((r) => {
                const open = openId === r.productId
                const productMoves = movementsByProduct.get(r.productId) ?? []
                return (
                  <li key={r.productId}>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : r.productId)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#FAFAFC] transition-colors"
                    >
                      <span
                        className={`shrink-0 flex items-center justify-center min-w-[44px] h-9 px-1.5 rounded-lg text-[12px] font-bold tabular-nums ${
                          r.onHand > 0
                            ? 'bg-brand-magenta/10 text-brand-magenta'
                            : 'bg-[#F5F5F7] text-brand-gray-400'
                        }`}
                      >
                        {r.colorNumber ?? '—'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-brand-gray-900 truncate">
                          {r.name.replace(/^[\d.]+ /, '')}
                        </span>
                        <span className="block mt-0.5 text-[11px] text-brand-gray-500">
                          Paimta {r.taken}
                          {r.sold > 0 && <> · parduota {r.sold}</>}
                          {r.returned > 0 && <> · grąžinta {r.returned}</>}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 tabular-nums font-bold ${
                          r.onHand > 0 ? 'text-brand-gray-900' : 'text-brand-gray-400'
                        }`}
                      >
                        {r.onHand}
                        <span className="ml-0.5 text-[11px] font-semibold text-brand-gray-400">
                          vnt.
                        </span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-brand-gray-400 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {open && (
                      <div className="px-4 pb-3 bg-[#FAFAFC] border-t border-[#f3f3f3]">
                        {productMoves.length === 0 ? (
                          <div className="pt-3 text-[12px] text-brand-gray-500">
                            Judėjimų nėra.
                          </div>
                        ) : (
                          <ul className="pt-2 space-y-1.5">
                            {productMoves.map((m, i) => {
                              const rl = REASON_LABELS[m.reason]
                              const isOrder =
                                m.reason === 'rep_sale' || m.reason === 'rep_sale_cancel'
                              return (
                                <li
                                  key={i}
                                  className="flex items-center justify-between gap-2 text-[12px]"
                                >
                                  <span className="text-brand-gray-500 whitespace-nowrap">
                                    {DATE.format(new Date(m.createdAt))}
                                  </span>
                                  <span
                                    className={`px-1.5 py-px rounded text-[11px] font-semibold ${rl.cls}`}
                                  >
                                    {rl.label}
                                  </span>
                                  {isOrder && m.source && (
                                    <span className="hidden sm:inline flex-1 font-mono text-[11px] text-brand-gray-400 truncate">
                                      {m.source}
                                    </span>
                                  )}
                                  <span
                                    className={`ml-auto tabular-nums font-bold ${
                                      rl.sign === '+'
                                        ? 'text-emerald-700'
                                        : 'text-brand-gray-900'
                                    }`}
                                  >
                                    {rl.sign}
                                    {m.qty}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      ) : filteredMovements.length === 0 ? (
        <EmptyState text={q ? 'Pagal paiešką nieko nerasta.' : 'Judėjimų dar nėra.'} />
      ) : (
        <div className="bg-white rounded-2xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <ul className="divide-y divide-[#f3f3f3]">
            {filteredMovements.map((m, i) => {
              const rl = REASON_LABELS[m.reason]
              const isOrder = m.reason === 'rep_sale' || m.reason === 'rep_sale_cancel'
              return (
                <li key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${rl.cls}`}
                    >
                      {rl.label}
                    </span>
                    <span
                      className={`tabular-nums font-bold ${
                        rl.sign === '+' ? 'text-emerald-700' : 'text-brand-gray-900'
                      }`}
                    >
                      {rl.sign}
                      {m.qty}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-brand-gray-900">
                    {m.colorNumber ? `${m.colorNumber} · ` : ''}
                    {m.name.replace(/^[\d.]+ /, '')}
                  </div>
                  <div className="mt-0.5 text-[11px] text-brand-gray-500">
                    {DATE_TIME.format(new Date(m.createdAt))}
                    {isOrder && m.source && <span className="font-mono"> · {m.source}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
        accent
          ? 'bg-gradient-to-br from-brand-magenta to-brand-blue text-white border-transparent'
          : 'bg-white border-[#eee]'
      }`}
    >
      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.5px] ${
          accent ? 'text-white/80' : 'text-brand-gray-500'
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-lg leading-none font-bold tabular-nums ${
          accent ? 'text-white' : 'text-brand-gray-900'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-12 text-center">
      <Package size={28} className="mx-auto text-brand-gray-300" />
      <p className="mt-3 text-sm text-brand-gray-500">{text}</p>
    </div>
  )
}
