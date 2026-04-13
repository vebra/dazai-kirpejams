'use client'

import { useState } from 'react'
import { deleteSubscriberAction, toggleSubscriberAction } from './actions'
import type { NewsletterSubscriberRow } from '@/lib/admin/queries'

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

export function SubscribersTable({
  subscribers,
}: {
  subscribers: NewsletterSubscriberRow[]
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>(
    'all'
  )
  const [search, setSearch] = useState('')

  const filtered = subscribers.filter((s) => {
    if (filter === 'active' && !s.isActive) return false
    if (filter === 'unsubscribed' && s.isActive) return false
    if (search && !s.email.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  const activeCount = subscribers.filter((s) => s.isActive).length
  const unsubCount = subscribers.length - activeCount

  const handleExport = () => {
    const rows = filtered.map((s) =>
      [s.email, s.locale ?? '', s.isActive ? 'active' : 'unsubscribed', s.subscribedAt].join(',')
    )
    const csv = ['email,locale,status,subscribed_at', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prenumeratoriai_${new Date().toISOString().substring(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'unsubscribed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                filter === s
                  ? 'bg-brand-gray-900 text-white'
                  : 'bg-[#F5F5F7] text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              {s === 'all'
                ? `Visi (${subscribers.length})`
                : s === 'active'
                  ? `Aktyvūs (${activeCount})`
                  : `Atsisakę (${unsubCount})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ieškoti el. pašto..."
            className="px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors w-[220px]"
          />
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-[#E0E0E0] text-sm font-medium text-brand-gray-900 rounded-lg hover:border-brand-magenta hover:text-brand-magenta transition-colors"
          >
            Eksportuoti CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            {subscribers.length === 0
              ? 'Prenumeratorių kol kas nėra.'
              : 'Nerasta prenumeratorių pagal filtrą.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-6 py-3 text-left">El. paštas</th>
                  <th className="px-6 py-3 text-center">Kalba</th>
                  <th className="px-6 py-3 text-center">Būsena</th>
                  <th className="px-6 py-3 text-left">Prenumeruota</th>
                  <th className="px-6 py-3 text-right">Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-brand-gray-900">
                      {sub.email}
                    </td>
                    <td className="px-6 py-3 text-center text-brand-gray-500 uppercase text-[12px]">
                      {sub.locale ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <form action={toggleSubscriberAction}>
                        <input type="hidden" name="id" value={sub.id} />
                        <input
                          type="hidden"
                          name="activate"
                          value={sub.isActive ? 'false' : 'true'}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            sub.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {sub.isActive ? 'Aktyvus' : 'Atsisakė'}
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-3 text-brand-gray-500 text-[12px]">
                      {formatDate(sub.subscribedAt)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <form
                        action={deleteSubscriberAction}
                        onSubmit={(e) => {
                          if (
                            !confirm(
                              `Tikrai ištrinti "${sub.email}"?`
                            )
                          ) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={sub.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 text-[12px] font-medium text-red-500 hover:text-red-700 transition-colors"
                        >
                          Trinti
                        </button>
                      </form>
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
