'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { MarketingEmailSendRow } from '@/lib/admin/marketing-queries'

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-brand-gray-500',
  sent: 'text-emerald-700',
  failed: 'text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '… laukia',
  sent: '✓ pristatyta',
  failed: '✗ nepavyko',
}

/**
 * Klientinis komponentas — filtruoja siuntimų žurnalo eilutes pagal
 * el. paštą / kampanijos pavadinimą + statusą. Filtravimas vykdomas
 * klientinėje pusėje (visos eilutės jau atneštos serveryje, max 2000
 * per query).
 */
export function SendsLogTable({ rows }: { rows: MarketingEmailSendRow[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'opened'>(
    'all'
  )

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('lt-LT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter === 'sent' && r.status !== 'sent') return false
      if (filter === 'failed' && r.status !== 'failed') return false
      if (filter === 'opened' && !r.openedAt) return false
      if (!q) return true
      const hay = `${r.email} ${r.campaignName} ${r.campaignSubject}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Filtras: el. paštas, kampanijos pavadinimas, tema…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] px-4 py-2 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
        />
        <div className="flex items-center gap-1 text-[12px]">
          {(['all', 'sent', 'failed', 'opened'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md font-semibold border transition-colors ${
                filter === f
                  ? 'bg-brand-magenta text-white border-brand-magenta'
                  : 'bg-white text-brand-gray-500 border-[#eee] hover:border-brand-gray-500'
              }`}
            >
              {f === 'all'
                ? 'Visi'
                : f === 'sent'
                  ? 'Pristatyta'
                  : f === 'failed'
                    ? 'Nepavyko'
                    : 'Atidaryta'}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-brand-gray-500 ml-auto">
          Rodoma <strong>{filtered.length}</strong> iš {rows.length}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            Nieko nerasta. Pakeiskit filtrą.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left w-[160px]">Data</th>
                  <th className="px-4 py-3 text-left">Kampanija</th>
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-left w-[110px]">Statusas</th>
                  <th className="px-4 py-3 text-left w-[140px]">Atidaryta</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[#eee] hover:bg-[#FAFAFB]"
                  >
                    <td className="px-4 py-3 text-[12px] text-brand-gray-500">
                      {r.sentAt ? dateFmt.format(new Date(r.sentAt)) : '—'}
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <Link
                        href={`/admin/kampanijos/${r.campaignId}`}
                        className="text-brand-gray-900 hover:text-brand-magenta font-medium"
                      >
                        {r.campaignName}
                      </Link>
                      <div className="text-[11px] text-brand-gray-500 truncate max-w-md">
                        {r.campaignSubject}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-brand-gray-900">
                      {r.email}
                    </td>
                    <td
                      className={`px-4 py-3 text-[12px] font-semibold ${STATUS_COLORS[r.status]}`}
                    >
                      {STATUS_LABELS[r.status]}
                      {r.errorMessage && (
                        <div
                          className="text-[10px] text-red-600 mt-0.5 truncate max-w-[200px]"
                          title={r.errorMessage}
                        >
                          {r.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {r.openedAt ? (
                        <span
                          className="text-emerald-700"
                          title={`Pixel beacon load'ų: ${r.openedCount}`}
                        >
                          👁 {dateFmt.format(new Date(r.openedAt))}
                          {r.openedCount > 1 && (
                            <span className="text-brand-gray-500">
                              {' '}
                              ({r.openedCount})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-brand-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
