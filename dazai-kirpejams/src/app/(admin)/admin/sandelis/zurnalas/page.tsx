import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getStockMovements } from '@/lib/admin/queries'

export const metadata = { title: 'Sandelio žurnalas' }
export const dynamic = 'force-dynamic'

const REASON_LABEL: Record<string, string> = {
  receiving: 'Priėmimas',
  sale: 'Pardavimas',
  cancel_restore: 'Grąžinimas',
  correction: 'Korekcija',
  writeoff: 'Nurašymas',
  issue_to_rep: 'Išvežimas vadybininkei',
  return_from_rep: 'Grąžinimas iš vadybininkės',
  rep_sale: 'Pardavimas (vadybininkė)',
  rep_sale_cancel: 'Pardavimo atšaukimas (vadybininkė)',
}

const REASON_CLS: Record<string, string> = {
  receiving: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sale: 'bg-blue-50 text-blue-700 border-blue-200',
  cancel_restore: 'bg-amber-50 text-amber-700 border-amber-200',
  correction: 'bg-gray-100 text-gray-600 border-gray-200',
  writeoff: 'bg-red-50 text-red-700 border-red-200',
  issue_to_rep: 'bg-purple-50 text-purple-700 border-purple-200',
  return_from_rep: 'bg-teal-50 text-teal-700 border-teal-200',
  rep_sale: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rep_sale_cancel: 'bg-orange-50 text-orange-700 border-orange-200',
}

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Visi' },
  { value: 'receiving', label: 'Priėmimas' },
  { value: 'sale', label: 'Pardavimas' },
  { value: 'cancel_restore', label: 'Grąžinimas' },
  { value: 'correction', label: 'Korekcija' },
  { value: 'writeoff', label: 'Nurašymas' },
  { value: 'issue_to_rep', label: 'Išvežimas vadybininkei' },
  { value: 'return_from_rep', label: 'Grąžinimas iš vadybininkės' },
  { value: 'rep_sale', label: 'Pardavimas (vadybininkė)' },
  { value: 'rep_sale_cancel', label: 'Pardavimo atšaukimas (vadybininkė)' },
]

const DT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export default async function StockJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams
  const reason = typeof sp.reason === 'string' ? sp.reason : ''

  const movements = await getStockMovements({
    reason: reason || undefined,
    limit: 300,
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Sandelio žurnalas
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Likučių judėjimas: priėmimas, pardavimas, grąžinimas, korekcija.
          </p>
        </div>
        <Link
          href="/admin/sandelis"
          className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          ← Sandelis
        </Link>
      </div>

      {/* Filtrai */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = reason === f.value
          const href = f.value
            ? `/admin/sandelis/zurnalas?reason=${f.value}`
            : '/admin/sandelis/zurnalas'
          return (
            <Link
              key={f.value || 'all'}
              href={href}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                active
                  ? 'bg-brand-magenta text-white border-brand-magenta'
                  : 'bg-white text-brand-gray-900 border-[#ddd] hover:border-brand-magenta'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Lentelė */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {movements.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            Įrašų dar nėra.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Prekė</th>
                  <th className="px-4 py-3 text-center">Tipas</th>
                  <th className="px-4 py-3 text-right">Pokytis</th>
                  <th className="px-4 py-3 text-right">Likutis po</th>
                  <th className="px-4 py-3 text-left">Šaltinis</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    <td className="px-4 py-3 text-brand-gray-500 text-[12px] whitespace-nowrap">
                      {DT.format(new Date(m.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-gray-900">
                        {m.productName}
                      </div>
                      <div className="text-[11px] text-brand-gray-400 font-mono">
                        {m.colorNumber ?? m.sku ?? ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          REASON_CLS[m.reason] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {REASON_LABEL[m.reason] ?? m.reason}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        m.delta > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-gray-900">
                      {m.balanceAfter ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                      {m.source ?? '—'}
                      {m.note ? (
                        <span className="block text-[11px] text-brand-gray-400">
                          {m.note}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[12px] text-brand-gray-500">
        Rodoma naujausi {movements.length} įrašų.
      </p>
    </div>
  )
}
