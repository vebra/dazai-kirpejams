import Link from 'next/link'
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Package,
  ClipboardList,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { requireSalesRep } from '@/lib/rep/auth'
import {
  getMyRepStats,
  getMyRepOrders,
  getMyStockSummary,
} from '@/lib/rep/queries'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { APPROVAL_LABELS, APPROVAL_BADGE } from '@/lib/rep/types'

export const metadata = { title: 'Skydelis' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short', timeStyle: 'short' })
const TODAY = new Intl.DateTimeFormat('lt-LT', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export default async function RepDashboard() {
  const rep = await requireSalesRep()
  const supabase = await createServerSupabase()
  const [{ data: prof }, s, orders, stock] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('first_name')
      .eq('id', rep.user.id)
      .maybeSingle(),
    getMyRepStats(),
    getMyRepOrders(),
    getMyStockSummary(),
  ])

  const firstName = prof?.first_name || null
  const recent = orders.slice(0, 4)
  const onHand = stock.filter((r) => r.onHand > 0)
  const onHandUnits = onHand.reduce((t, r) => t + r.onHand, 0)

  const cards = [
    {
      label: 'Šio mėn. pardavimai',
      value: PRICE.format(s.thisMonthCents / 100),
      icon: TrendingUp,
      accent: true,
    },
    { label: 'Laukia patvirtinimo', value: String(s.pendingCount), icon: Clock },
    { label: 'Patvirtinta (viso)', value: String(s.approvedCount), icon: CheckCircle2 },
    { label: 'Klientai', value: String(s.clientCount), icon: Users },
  ]

  return (
    <div className="space-y-7">
      {/* Pasisveikinimas */}
      <div className="dk-fade-up">
        <h1 className="text-2xl font-bold text-brand-gray-900">
          {firstName ? `Labas, ${firstName}!` : 'Skydelis'}
        </h1>
        <p className="text-sm text-brand-gray-500 mt-0.5 first-letter:uppercase">
          {TODAY.format(new Date())}
        </p>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={`dk-fade-up rounded-2xl border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
              c.accent
                ? 'bg-gradient-to-br from-brand-magenta to-brand-blue text-white border-transparent'
                : 'bg-white border-[#eee]'
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div
                className={`text-[11px] font-semibold uppercase tracking-[0.5px] ${
                  c.accent ? 'text-white/80' : 'text-brand-gray-500'
                }`}
              >
                {c.label}
              </div>
              <c.icon
                size={16}
                className={c.accent ? 'text-white/70' : 'text-brand-gray-300'}
              />
            </div>
            <div
              className={`mt-2 text-[22px] leading-none font-bold tabular-nums ${
                c.accent ? 'text-white' : 'text-brand-gray-900'
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Naujausi užsakymai + atsargos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section
          className="dk-fade-up lg:col-span-3 bg-white rounded-2xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          style={{ animationDelay: '240ms' }}
        >
          <header className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-brand-gray-900">
              <ClipboardList size={16} className="text-brand-magenta" />
              Naujausi užsakymai
            </h2>
            <Link
              href="/vadybininke/uzsakymai"
              className="flex items-center gap-1 text-[12px] font-semibold text-brand-blue hover:underline"
            >
              Visi <ArrowRight size={13} />
            </Link>
          </header>
          {recent.length === 0 ? (
            <div className="px-5 pb-6 pt-2 text-sm text-brand-gray-500">
              Dar nepateikėte nė vieno užsakymo.{' '}
              <Link
                href="/vadybininke/naujas-uzsakymas"
                className="font-semibold text-brand-magenta hover:underline"
              >
                Sukurti pirmą →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#f3f3f3] border-t border-[#f3f3f3]">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/vadybininke/uzsakymai/${o.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAFAFC] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold text-brand-gray-900">
                          {o.orderNumber}
                        </span>
                        {o.approvalStatus && (
                          <span
                            className={`inline-flex px-1.5 py-px rounded-full text-[10px] font-semibold border ${APPROVAL_BADGE[o.approvalStatus]}`}
                          >
                            {APPROVAL_LABELS[o.approvalStatus]}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-brand-gray-500 truncate">
                        {DATE.format(new Date(o.createdAt))} · {o.clientName ?? '—'}
                      </div>
                    </div>
                    <span className="text-[13px] font-bold text-brand-gray-900 tabular-nums whitespace-nowrap">
                      {PRICE.format(o.totalCents / 100)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="dk-fade-up lg:col-span-2 bg-white rounded-2xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          style={{ animationDelay: '300ms' }}
        >
          <header className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-brand-gray-900">
              <Package size={16} className="text-brand-blue" />
              Mano atsargos
            </h2>
            <Link
              href="/vadybininke/atsargos"
              className="flex items-center gap-1 text-[12px] font-semibold text-brand-blue hover:underline"
            >
              Viskas <ArrowRight size={13} />
            </Link>
          </header>
          <div className="px-5 pb-1">
            <div className="text-[28px] leading-none font-bold text-brand-gray-900 tabular-nums">
              {onHandUnits}
              <span className="ml-1.5 text-[13px] font-semibold text-brand-gray-500">
                vnt. ({onHand.length} prekės)
              </span>
            </div>
          </div>
          {onHand.length === 0 ? (
            <div className="px-5 pb-6 pt-2 text-sm text-brand-gray-500">
              Šiuo metu prekių neturite.
            </div>
          ) : (
            <ul className="divide-y divide-[#f3f3f3] border-t border-[#f3f3f3] mt-3">
              {onHand.slice(0, 4).map((r) => (
                <li
                  key={r.productId}
                  className="flex items-center justify-between gap-3 px-5 py-2.5"
                >
                  <span className="text-[13px] text-brand-gray-900 truncate">
                    {r.colorNumber ? `${r.colorNumber} · ` : ''}
                    {r.name.replace(/^[\d.]+ /, '')}
                  </span>
                  <span className="text-[13px] font-bold text-brand-gray-900 tabular-nums whitespace-nowrap">
                    {r.onHand} vnt.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Greitas veiksmas */}
      <Link
        href="/vadybininke/naujas-uzsakymas"
        className="dk-fade-up group flex items-center justify-between gap-4 p-5 rounded-2xl bg-brand-magenta text-white shadow-[0_4px_14px_rgba(233,30,140,0.3)] hover:bg-brand-magenta-dark transition-colors"
        style={{ animationDelay: '360ms' }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15">
            <Plus size={20} strokeWidth={2.6} />
          </span>
          <div>
            <div className="font-bold">Naujas užsakymas</div>
            <div className="text-[12px] text-white/75">
              Klientas → prekės → pateikti patvirtinimui
            </div>
          </div>
        </div>
        <ArrowRight
          size={20}
          className="shrink-0 transition-transform group-hover:translate-x-1"
        />
      </Link>
    </div>
  )
}
