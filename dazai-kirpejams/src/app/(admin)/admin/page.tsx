import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getOverviewKpis,
  getRecentOrders,
  getLowStockProducts,
} from '@/lib/admin/queries'

export const metadata = {
  title: 'Apžvalga',
}

// Admin puslapiai visada renderinasi per-request (auth context priklauso nuo cookie)
export const dynamic = 'force-dynamic'

// ============================================
// Formatavimo helper'iai (vienkartiniai, lokalūs šiam puslapiui)
// ============================================

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDateTime(iso: string): string {
  return DATE_TIME_FORMATTER.format(new Date(iso))
}

// Užsakymo būsenos -> vizualus stilius ir LT label
const ORDER_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: 'Laukia',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  paid: {
    label: 'Apmokėta',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  processing: {
    label: 'Ruošiama',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  shipped: {
    label: 'Išsiųsta',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  delivered: {
    label: 'Pristatyta',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Atšaukta',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  refunded: {
    label: 'Grąžinta',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
}

function OrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}

// ============================================
// Puslapis
// ============================================

export default async function AdminOverviewPage() {
  await requireAdmin()

  // Visos trys užklausos nepriklauso viena nuo kitos → paraleliai
  const [kpis, recentOrders, lowStock] = await Promise.all([
    getOverviewKpis(),
    getRecentOrders(5),
    getLowStockProducts(50, 5),
  ])

  const kpiCards = [
    {
      label: 'Užsakymai šiandien',
      value: kpis.ordersToday.toString(),
      icon: '📦',
      accent: 'text-brand-magenta',
    },
    {
      label: 'Pajamos šiandien',
      value: formatCents(kpis.revenueTodayCents),
      icon: '💰',
      accent: 'text-emerald-600',
    },
    {
      label: 'Viso užsakymų',
      value: kpis.ordersTotal.toString(),
      icon: '📊',
      accent: 'text-blue-600',
    },
    {
      label: 'Aktyvūs produktai',
      value: kpis.productsActive.toString(),
      icon: '🎨',
      accent: 'text-indigo-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* KPI kortelės */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-6 border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                {card.label}
              </span>
              <span className="text-2xl" aria-hidden>
                {card.icon}
              </span>
            </div>
            <div className={`text-3xl font-bold ${card.accent}`}>
              {card.value}
            </div>
          </div>
        ))}
      </section>

      {/* Dvi kolonos: paskutiniai užsakymai + žemo likučio */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paskutiniai užsakymai — 2/3 pločio */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eee] flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-gray-900">
              Paskutiniai užsakymai
            </h2>
            <Link
              href="/admin/uzsakymai"
              className="text-[13px] font-medium text-brand-magenta hover:text-brand-magenta-dark transition-colors"
            >
              Visi →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
              Užsakymų kol kas nėra. Kai tik pirkėjai pradės užsakinėti — jie
              pasirodys čia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                    <th className="px-6 py-3 text-left">Nr.</th>
                    <th className="px-6 py-3 text-left">Klientas</th>
                    <th className="px-6 py-3 text-right">Suma</th>
                    <th className="px-6 py-3 text-left">Būsena</th>
                    <th className="px-6 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-[12px]">
                        <Link
                          href={`/admin/uzsakymai/${order.id}`}
                          className="text-brand-gray-900 hover:text-brand-magenta transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-brand-gray-900">
                        {order.customerName || '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-brand-gray-900">
                        {formatCents(order.totalCents)}
                      </td>
                      <td className="px-6 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-3 text-brand-gray-500 text-[12px]">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Žemo likučio produktai — 1/3 pločio */}
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eee] flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-gray-900">
              Žemas likutis
            </h2>
            <Link
              href="/admin/sandelis"
              className="text-[13px] font-medium text-brand-magenta hover:text-brand-magenta-dark transition-colors"
            >
              Sandėlis →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
              Visų produktų likutis virš 50 vnt. 👍
            </div>
          ) : (
            <ul className="divide-y divide-[#eee]">
              {lowStock.map((product) => (
                <li
                  key={product.id}
                  className="px-6 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-brand-gray-900 truncate">
                      {product.nameLt}
                    </div>
                    <div className="text-[11px] text-brand-gray-500 font-mono mt-0.5">
                      {product.colorNumber ?? product.sku ?? product.slug}
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 text-sm font-bold ${
                      product.stockQuantity === 0
                        ? 'text-red-600'
                        : product.stockQuantity < 10
                          ? 'text-amber-600'
                          : 'text-brand-gray-900'
                    }`}
                  >
                    {product.stockQuantity} vnt.
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Antrinės kortelės apačioje */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/admin/b2b"
          className="bg-white rounded-xl p-6 border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-brand-magenta/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
                Naujos B2B užklausos
              </div>
              <div className="text-2xl font-bold text-brand-gray-900">
                {kpis.b2bInquiriesNew}
              </div>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform" aria-hidden>
              🤝
            </div>
          </div>
        </Link>

        <Link
          href="/admin/naujienlaiskiai"
          className="bg-white rounded-xl p-6 border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-brand-magenta/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
                Naujienlaiškio prenumeratoriai
              </div>
              <div className="text-2xl font-bold text-brand-gray-900">
                {kpis.newsletterSubscribers}
              </div>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform" aria-hidden>
              📧
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
