import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminOrders,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type AdminOrderListOptions,
  type OrderStatus,
} from '@/lib/admin/queries'

export const metadata = {
  title: 'Užsakymai',
}

export const dynamic = 'force-dynamic'

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

function parseStatus(raw: string | undefined): OrderStatus | undefined {
  if (!raw || raw === 'all') return undefined
  return (ORDER_STATUSES as readonly string[]).includes(raw)
    ? (raw as OrderStatus)
    : undefined
}

const DELIVERY_LABELS: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
}

const PAYMENT_LABELS: Record<string, string> = {
  stripe: 'Kortelė',
  paysera: 'Paysera',
  bank_transfer: 'Pavedimas',
}

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<'/admin/uzsakymai'>) {
  await requireAdmin()

  const sp = await searchParams
  const search = typeof sp.q === 'string' ? sp.q : undefined
  const status = parseStatus(typeof sp.status === 'string' ? sp.status : undefined)
  const dateFrom = typeof sp.from === 'string' ? sp.from : undefined
  const dateTo = typeof sp.to === 'string' ? sp.to : undefined
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined

  const options: AdminOrderListOptions = {
    search,
    status,
    dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
    dateTo: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
  }

  const orders = await getAdminOrders(options)

  // Suvestinė pagal būseną — rodoma viršuje kaip tab'ai
  const statusCounts: Record<OrderStatus, number> = {
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  }
  for (const o of orders) {
    statusCounts[o.status]++
  }

  const errorMessage =
    errorParam === 'invalid-id'
      ? 'Trūksta užsakymo ID.'
      : errorParam === 'update-failed'
        ? 'Nepavyko išsaugoti pakeitimų.'
        : null

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Antraštė + CSV eksportas */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">Užsakymai</h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Visi parduotuvės užsakymai — filtruokite, keiskite būsenas, tvarkykite.
          </p>
        </div>
        <a
          href={`/admin/uzsakymai/eksportas${status ? `?status=${status}` : ''}${dateFrom ? `${status ? '&' : '?'}from=${dateFrom}` : ''}${dateTo ? `${status || dateFrom ? '&' : '?'}to=${dateTo}` : ''}`}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900 transition-colors"
          download
        >
          CSV eksportas
        </a>
      </div>

      {/* Būsenų tab'ai */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2 flex flex-wrap gap-1">
        <Link
          href="/admin/uzsakymai"
          className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            !status
              ? 'bg-brand-magenta text-white'
              : 'text-brand-gray-900 hover:bg-[#F5F5F7]'
          }`}
        >
          Visi ({orders.length})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/uzsakymai?status=${s}`}
            className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
              status === s
                ? 'bg-brand-magenta text-white'
                : 'text-brand-gray-900 hover:bg-[#F5F5F7]'
            }`}
          >
            {ORDER_STATUS_LABELS[s]} ({statusCounts[s]})
          </Link>
        ))}
      </div>

      {/* Filtrų juosta */}
      <form
        method="get"
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
      >
        {status && <input type="hidden" name="status" value={status} />}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label
              htmlFor="q"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Paieška
            </label>
            <input
              type="text"
              id="q"
              name="q"
              defaultValue={search ?? ''}
              placeholder="Užsakymo nr., el. paštas, vardas, įmonė"
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="from"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Nuo
            </label>
            <input
              type="date"
              id="from"
              name="from"
              defaultValue={dateFrom ?? ''}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="to"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Iki
            </label>
            <input
              type="date"
              id="to"
              name="to"
              defaultValue={dateTo ?? ''}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
            >
              Filtruoti
            </button>
            {(search || dateFrom || dateTo) && (
              <Link
                href={status ? `/admin/uzsakymai?status=${status}` : '/admin/uzsakymai'}
                className="px-4 py-2.5 border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
              >
                Išvalyti
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Užsakymų lentelė */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-brand-gray-500">
            Užsakymų nerasta pagal pasirinktus filtrus.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Nr.</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Klientas</th>
                  <th className="px-4 py-3 text-left">Pristatymas</th>
                  <th className="px-4 py-3 text-left">Mokėjimas</th>
                  <th className="px-4 py-3 text-center w-[60px]">Prekės</th>
                  <th className="px-4 py-3 text-right">Suma</th>
                  <th className="px-4 py-3 text-center w-[140px]">Būsena</th>
                  <th className="px-4 py-3 text-right w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-[13px] font-semibold text-brand-gray-900">
                        {o.orderNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-brand-gray-900 truncate">
                            {o.customerName}
                          </div>
                          <div className="text-[11px] text-brand-gray-500 truncate">
                            {o.email}
                          </div>
                        </div>
                        {o.isB2b && (
                          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                            B2B
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">
                      {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">
                      {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-center text-brand-gray-500">
                      {o.itemCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                      {formatCents(o.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${ORDER_STATUS_COLORS[o.status]}`}
                      >
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/uzsakymai/${o.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[12px] font-semibold text-brand-gray-900 transition-colors"
                      >
                        Atidaryti →
                      </Link>
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
