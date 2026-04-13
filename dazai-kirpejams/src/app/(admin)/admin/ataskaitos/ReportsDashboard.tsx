'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ReportsData, ReportPeriod } from '@/lib/admin/queries'

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: '7d', label: '7 d.' },
  { value: '30d', label: '30 d.' },
  { value: '90d', label: '90 d.' },
  { value: '365d', label: 'Metai' },
  { value: 'all', label: 'Viskas' },
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Laukia',
  paid: 'Apmokėta',
  processing: 'Ruošiama',
  shipped: 'Išsiųsta',
  delivered: 'Pristatyta',
  cancelled: 'Atšaukta',
  refunded: 'Grąžinta',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-400',
  paid: 'bg-emerald-500',
  processing: 'bg-blue-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-emerald-600',
  cancelled: 'bg-red-500',
  refunded: 'bg-gray-400',
}

const DELIVERY_LABELS: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
  unknown: 'Nenurodyta',
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Pavedimas',
  card: 'Kortelė',
  paysera: 'Paysera',
  unknown: 'Nenurodyta',
}

type Props = {
  data: ReportsData
  currentPeriod: ReportPeriod
}

export function ReportsDashboard({ data, currentPeriod }: Props) {
  const searchParams = useSearchParams()

  const maxDailyRevenue = Math.max(
    ...data.dailyRevenue.map((d) => d.revenueCents),
    1
  )

  return (
    <div className="space-y-8">
      {/* Laikotarpio pasirinkimas */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/admin/ataskaitos?period=${p.value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPeriod === p.value
                ? 'bg-brand-magenta text-white'
                : 'bg-white border border-[#eee] text-brand-gray-500 hover:text-brand-gray-900 hover:border-brand-gray-500/30'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* KPI kortelės */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KpiCard
          label="Viso užsakymų"
          value={data.totalOrders.toString()}
          icon="📦"
          accent="text-blue-600"
        />
        <KpiCard
          label="Pajamos"
          value={formatCents(data.totalRevenueCents)}
          icon="💰"
          accent="text-emerald-600"
        />
        <KpiCard
          label="Vid. užsakymas"
          value={formatCents(data.avgOrderCents)}
          icon="📊"
          accent="text-brand-magenta"
        />
      </section>

      {/* Pajamų grafikas */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#eee]">
          <h2 className="text-base font-bold text-brand-gray-900">
            Pajamos pagal dieną
          </h2>
        </div>
        {data.dailyRevenue.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            Per šį laikotarpį apmokėtų užsakymų nėra.
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="flex items-end gap-[2px] h-[200px]">
              {data.dailyRevenue.map((day) => {
                const heightPct = Math.max(
                  2,
                  (day.revenueCents / maxDailyRevenue) * 100
                )
                return (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[4px] group relative"
                    style={{ height: '100%' }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                      <div
                        className="w-full bg-brand-magenta/80 hover:bg-brand-magenta rounded-t transition-colors min-h-[2px]"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-brand-gray-900 text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <div className="font-semibold">
                          {day.date.substring(5)}
                        </div>
                        <div>{formatCents(day.revenueCents)}</div>
                        <div className="text-white/70">
                          {day.orderCount} užs.
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* X axis labels — show first, middle, last */}
            {data.dailyRevenue.length >= 2 && (
              <div className="flex justify-between mt-2 text-[10px] text-brand-gray-500">
                <span>{data.dailyRevenue[0].date.substring(5)}</span>
                {data.dailyRevenue.length > 2 && (
                  <span>
                    {data.dailyRevenue[
                      Math.floor(data.dailyRevenue.length / 2)
                    ].date.substring(5)}
                  </span>
                )}
                <span>
                  {data.dailyRevenue[
                    data.dailyRevenue.length - 1
                  ].date.substring(5)}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dvi kolonos: top produktai + breakdowns */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top produktai — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eee]">
            <h2 className="text-base font-bold text-brand-gray-900">
              Populiariausi produktai
            </h2>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
              Per šį laikotarpį parduotų produktų nėra.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                    <th className="px-6 py-3 text-left">#</th>
                    <th className="px-6 py-3 text-left">Produktas</th>
                    <th className="px-6 py-3 text-right">Kiekis</th>
                    <th className="px-6 py-3 text-right">Suma</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product, idx) => (
                    <tr
                      key={product.sku ?? product.productName}
                      className="border-t border-[#eee]"
                    >
                      <td className="px-6 py-3 text-brand-gray-500 text-[12px]">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-brand-gray-900">
                          {product.productName}
                        </div>
                        {product.sku && (
                          <div className="text-[11px] text-brand-gray-500 font-mono mt-0.5">
                            {product.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-brand-gray-900 tabular-nums">
                        {product.totalQuantity} vnt.
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-brand-gray-900 tabular-nums">
                        {formatCents(product.totalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Breakdowns — 1/3 */}
        <div className="space-y-6">
          <BreakdownCard
            title="Užsakymų būsenos"
            items={data.statusBreakdown}
            total={data.totalOrders}
            labels={STATUS_LABELS}
            colors={STATUS_COLORS}
          />
          <BreakdownCard
            title="Pristatymo būdai"
            items={data.deliveryBreakdown}
            total={data.totalOrders}
            labels={DELIVERY_LABELS}
            colors={{}}
          />
          <BreakdownCard
            title="Mokėjimo būdai"
            items={data.paymentBreakdown}
            total={data.totalOrders}
            labels={PAYMENT_LABELS}
            colors={{}}
          />
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: string
  accent: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          {label}
        </span>
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
      </div>
      <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  )
}

function BreakdownCard({
  title,
  items,
  total,
  labels,
  colors,
}: {
  title: string
  items: { status: string; count: number }[]
  total: number
  labels: Record<string, string>
  colors: Record<string, string>
}) {
  return (
    <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#eee]">
        <h3 className="text-sm font-bold text-brand-gray-900">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-6 text-center text-[13px] text-brand-gray-500">
          Nėra duomenų
        </div>
      ) : (
        <ul className="divide-y divide-[#eee]">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            const colorClass = colors[item.status] ?? 'bg-brand-gray-500/60'
            return (
              <li
                key={item.status}
                className="px-5 py-3 flex items-center gap-3"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`}
                />
                <span className="flex-1 text-sm text-brand-gray-900">
                  {labels[item.status] ?? item.status}
                </span>
                <span className="text-sm font-semibold text-brand-gray-900 tabular-nums">
                  {item.count}
                </span>
                <span className="text-[11px] text-brand-gray-500 tabular-nums w-10 text-right">
                  {pct}%
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
