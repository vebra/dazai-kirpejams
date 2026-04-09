import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminOrderById,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from '@/lib/admin/queries'
import {
  updateOrderStatusAction,
  updateOrderNotesAction,
  updateTrackingAction,
} from '../actions'

export const metadata = {
  title: 'Užsakymas',
}

export const dynamic = 'force-dynamic'

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'full',
  timeStyle: 'short',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

const DELIVERY_LABELS: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
}

const PAYMENT_LABELS: Record<string, string> = {
  stripe: 'Banko kortelė (Stripe)',
  paysera: 'Paysera',
  bank_transfer: 'Banko pavedimas',
}

/**
 * Loginis srautas būsenų keitimui — vizualiai parodo kelią:
 * pending → paid → processing → shipped → delivered
 *
 * cancelled / refunded yra galutinės, todėl rodomos atskirai.
 */
const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
]

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps<'/admin/uzsakymai/[id]'>) {
  await requireAdmin()

  const { id } = await params
  const sp = await searchParams
  const order = await getAdminOrderById(id)

  if (!order) {
    notFound()
  }

  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const statusUpdated = sp['status-updated'] === '1'
  const notesUpdated = sp['notes-updated'] === '1'
  const trackingUpdated = sp['tracking-updated'] === '1'

  const errorMessage =
    errorParam === 'invalid-status'
      ? 'Neteisinga būsena.'
      : errorParam === 'update-failed'
        ? 'Nepavyko išsaugoti pakeitimų.'
        : null

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status)
  const isTerminal =
    order.status === 'cancelled' || order.status === 'refunded'

  const fullName = `${order.firstName} ${order.lastName}`.trim()
  const hasAddress = Boolean(
    order.deliveryAddress || order.deliveryCity || order.deliveryPostalCode
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-brand-gray-500">
        <Link
          href="/admin/uzsakymai"
          className="hover:text-brand-magenta transition-colors"
        >
          ← Atgal į užsakymus
        </Link>
      </div>

      {/* Pranešimai */}
      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      {statusUpdated && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Būsena atnaujinta
        </div>
      )}
      {notesUpdated && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Pastabos išsaugotos
        </div>
      )}
      {trackingUpdated && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Siuntimo sekimo informacija išsaugota
        </div>
      )}

      {/* Antraštė */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              Užsakymas
            </div>
            <h2 className="mt-1 text-2xl font-bold text-brand-gray-900 font-mono">
              {order.orderNumber}
            </h2>
            <div className="mt-1 text-[13px] text-brand-gray-500">
              {formatDate(order.createdAt)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold border ${ORDER_STATUS_COLORS[order.status]}`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                Iš viso
              </div>
              <div className="text-xl font-bold text-brand-gray-900">
                {formatCents(order.totalCents)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Būsenos valdymas */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
          Būsenos keitimas
        </h3>

        {/* Srauto indikatorius */}
        {!isTerminal && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
            {STATUS_FLOW.map((s, idx) => {
              const done = idx < currentStatusIndex
              const current = idx === currentStatusIndex
              return (
                <div key={s} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
                      current
                        ? ORDER_STATUS_COLORS[s]
                        : done
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-[#F5F5F7] text-brand-gray-500 border-[#eee]'
                    }`}
                  >
                    {done && <span>✓</span>}
                    {ORDER_STATUS_LABELS[s]}
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div className="w-4 h-px bg-[#ddd]" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Mygtukai — kiekviena būsena kaip atskira forma */}
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
            <form key={s} action={updateOrderStatusAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                className={`px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors hover:opacity-90 ${ORDER_STATUS_COLORS[s]}`}
              >
                → {ORDER_STATUS_LABELS[s]}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Prekių sąrašas */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#eee]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Prekės ({order.items.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-4 py-3 text-left">Produktas</th>
                <th className="px-4 py-3 text-left w-[140px]">SKU</th>
                <th className="px-4 py-3 text-center w-[80px]">Kiekis</th>
                <th className="px-4 py-3 text-right w-[120px]">Vnt. kaina</th>
                <th className="px-4 py-3 text-right w-[120px]">Iš viso</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-[#eee]">
                  <td className="px-4 py-3">
                    {item.productId ? (
                      <Link
                        href={`/admin/sandelis/${item.productId}`}
                        className="font-medium text-brand-gray-900 hover:text-brand-magenta transition-colors"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <span className="font-medium text-brand-gray-900">
                        {item.productName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-gray-500 font-mono text-[12px]">
                    {item.productSku ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-brand-gray-900 font-semibold">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-gray-500">
                    {formatCents(item.unitPriceCents)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                    {formatCents(item.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F9F9FB]">
              <tr className="border-t border-[#eee]">
                <td colSpan={4} className="px-4 py-2 text-right text-brand-gray-500 text-[13px]">
                  Prekių suma
                </td>
                <td className="px-4 py-2 text-right text-brand-gray-900 text-[13px]">
                  {formatCents(order.subtotalCents)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-brand-gray-500 text-[13px]">
                  Pristatymas
                </td>
                <td className="px-4 py-2 text-right text-brand-gray-900 text-[13px]">
                  {formatCents(order.deliveryCostCents)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-brand-gray-500 text-[13px]">
                  PVM (21%)
                </td>
                <td className="px-4 py-2 text-right text-brand-gray-900 text-[13px]">
                  {formatCents(order.vatCents)}
                </td>
              </tr>
              <tr className="border-t border-[#eee]">
                <td colSpan={4} className="px-4 py-3 text-right font-bold text-brand-gray-900">
                  Iš viso
                </td>
                <td className="px-4 py-3 text-right font-bold text-brand-gray-900 text-lg">
                  {formatCents(order.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Klientas + pristatymas — 2 stulpeliai */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Klientas */}
        <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
            Klientas {order.companyName && '(B2B)'}
          </h3>
          <dl className="space-y-3 text-sm">
            {order.companyName && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  Įmonė
                </dt>
                <dd className="mt-0.5 text-brand-gray-900 font-semibold">
                  {order.companyName}
                </dd>
                {(order.companyCode || order.vatCode) && (
                  <dd className="mt-0.5 text-[12px] text-brand-gray-500">
                    {order.companyCode && `Įm. k.: ${order.companyCode}`}
                    {order.companyCode && order.vatCode && ' · '}
                    {order.vatCode && `PVM k.: ${order.vatCode}`}
                  </dd>
                )}
              </div>
            )}
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                Kontaktinis asmuo
              </dt>
              <dd className="mt-0.5 text-brand-gray-900">{fullName || '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                El. paštas
              </dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${order.email}`}
                  className="text-brand-magenta hover:underline"
                >
                  {order.email}
                </a>
              </dd>
            </div>
            {order.phone && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  Telefonas
                </dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:${order.phone}`}
                    className="text-brand-magenta hover:underline"
                  >
                    {order.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Pristatymas */}
        <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
            Pristatymas
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                Būdas
              </dt>
              <dd className="mt-0.5 text-brand-gray-900">
                {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
              </dd>
            </div>
            {hasAddress && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  Adresas
                </dt>
                <dd className="mt-0.5 text-brand-gray-900 whitespace-pre-line">
                  {[
                    order.deliveryAddress,
                    [order.deliveryPostalCode, order.deliveryCity]
                      .filter(Boolean)
                      .join(' '),
                    order.deliveryCountry,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </dd>
              </div>
            )}
            {order.deliveryNotes && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  Pristatymo pastabos
                </dt>
                <dd className="mt-0.5 text-brand-gray-900 italic">
                  {order.deliveryNotes}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      {/* Siuntimo sekimas */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
          Siuntimo sekimas
        </h3>
        <form action={updateTrackingAction} className="space-y-4">
          <input type="hidden" name="id" value={order.id} />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 items-end">
            <div>
              <label
                htmlFor="tracking_number"
                className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
              >
                Sekimo numeris
              </label>
              <input
                type="text"
                id="tracking_number"
                name="tracking_number"
                defaultValue={order.trackingNumber ?? ''}
                placeholder="pvz. GR000012345LT"
                className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm font-mono focus:outline-none focus:border-brand-magenta focus:bg-white"
              />
            </div>
            <div>
              <label
                htmlFor="tracking_carrier"
                className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
              >
                Kurjeris
              </label>
              <select
                id="tracking_carrier"
                name="tracking_carrier"
                defaultValue={order.trackingCarrier ?? ''}
                className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
              >
                <option value="">— Pasirinkti —</option>
                <option value="omniva">Omniva</option>
                <option value="dpd">DPD</option>
                <option value="lp_express">LP Express</option>
                <option value="other">Kitas</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
            >
              Išsaugoti
            </button>
          </div>
        </form>
      </section>

      {/* Mokėjimas */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
          Mokėjimas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              Būdas
            </dt>
            <dd className="mt-0.5 text-brand-gray-900">
              {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              Mokėjimo būsena
            </dt>
            <dd className="mt-0.5 text-brand-gray-900">
              {order.paymentStatus ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              Mokėjimo nuoroda
            </dt>
            <dd className="mt-0.5 text-brand-gray-900 font-mono text-[12px] break-all">
              {order.paymentReference ?? '—'}
            </dd>
          </div>
        </div>
      </section>

      {/* Vidinės pastabos */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
          Vidinės pastabos (admin)
        </h3>
        <form action={updateOrderNotesAction} className="space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <textarea
            name="notes"
            defaultValue={order.notes ?? ''}
            rows={4}
            placeholder="Pvz. susisiekta tel., laukia patvirtinimo, siunčiame Omniva..."
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
            >
              Išsaugoti pastabas
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
