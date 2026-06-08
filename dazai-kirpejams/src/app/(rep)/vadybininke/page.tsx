import Link from 'next/link'
import { requireSalesRep } from '@/lib/rep/auth'
import { getMyRepStats } from '@/lib/rep/queries'

export const metadata = { title: 'Skydelis' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })

export default async function RepDashboard() {
  await requireSalesRep()
  const s = await getMyRepStats()

  const cards = [
    {
      label: 'Šio mėn. pardavimai (patvirtinti)',
      value: PRICE.format(s.thisMonthCents / 100),
      accent: true,
    },
    { label: 'Laukia patvirtinimo', value: String(s.pendingCount) },
    { label: 'Patvirtinta (viso)', value: String(s.approvedCount) },
    { label: 'Klientai', value: String(s.clientCount) },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Skydelis</h1>
      <p className="text-sm text-brand-gray-500 mb-6">Jūsų darbo apžvalga.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
              c.accent
                ? 'bg-brand-magenta/5 border-brand-magenta/20'
                : 'bg-white border-[#eee]'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              {c.label}
            </div>
            <div
              className={`mt-1 text-xl font-bold ${c.accent ? 'text-brand-magenta' : 'text-brand-gray-900'}`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/vadybininke/naujas-uzsakymas"
          className="block p-5 rounded-xl bg-brand-magenta text-white font-semibold hover:bg-brand-magenta-dark transition-colors"
        >
          ➕ Naujas užsakymas
        </Link>
        <Link
          href="/vadybininke/uzsakymai"
          className="block p-5 rounded-xl bg-white border border-[#eee] font-semibold text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
        >
          📋 Mano užsakymai
        </Link>
        <Link
          href="/vadybininke/klientai"
          className="block p-5 rounded-xl bg-white border border-[#eee] font-semibold text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
        >
          👥 Klientai
        </Link>
        <Link
          href="/vadybininke/atsargos"
          className="block p-5 rounded-xl bg-white border border-[#eee] font-semibold text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
        >
          📦 Mano atsargos
        </Link>
      </div>
    </div>
  )
}
