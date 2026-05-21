import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAllMarketingEmailSends } from '@/lib/admin/marketing-queries'
import { SendsLogTable } from './SendsLogTable'

export const metadata = { title: 'Siuntimų žurnalas' }
export const dynamic = 'force-dynamic'

export default async function SendsLogPage() {
  await requireAdmin()
  const rows = await getAllMarketingEmailSends()

  const totalSent = rows.filter((r) => r.status === 'sent').length
  const totalFailed = rows.filter((r) => r.status === 'failed').length
  const totalOpened = rows.filter((r) => r.openedAt).length

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/kampanijos"
          className="text-sm text-brand-gray-500 hover:text-brand-gray-900"
        >
          ← Kampanijos
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Siuntimų žurnalas
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Visi marketing kampanijų laiškai vienoje vietoje — kuriam el. paštui
          kokia kampanija išsiųsta, ar pristatyta, ar atidaryta. Naujausi
          viršuje (max 2000 įrašų).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#eee] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Viso siuntimų
          </div>
          <div className="text-2xl font-bold text-brand-gray-900 mt-1 tabular-nums">
            {rows.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-emerald-700">
            Pristatyta
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {totalSent}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-red-600">
            Nepavyko
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1 tabular-nums">
            {totalFailed}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#eee] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Atidaryta
          </div>
          <div className="text-2xl font-bold text-brand-gray-900 mt-1 tabular-nums">
            {totalOpened}
          </div>
          {totalSent > 0 && (
            <div className="text-[11px] text-brand-gray-500 mt-0.5">
              {Math.round((totalOpened / totalSent) * 100)}% iš pristatytų
            </div>
          )}
        </div>
      </div>

      <SendsLogTable rows={rows} />

      <p className="text-[11px] text-brand-gray-500 leading-relaxed">
        Pastaba apie „atidaryta": Gmail/Outlook proxy paveikslus iškart gavus
        laišką, todėl jų vartotojams reikšmė dažniausiai reiškia „pristatyta
        į inbox", ne tikrą atidarymą. Apple Mail ir kai kurie kiti rodo
        realius open'us.
      </p>
    </div>
  )
}
