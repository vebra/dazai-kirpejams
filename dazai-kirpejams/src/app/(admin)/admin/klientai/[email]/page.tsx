import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminCustomerByEmail,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/admin/queries'

export const metadata = {
  title: 'Klientas',
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

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

function formatDateOnly(iso: string): string {
  return DATE_ONLY_FORMATTER.format(new Date(iso))
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

export default async function AdminCustomerDetailPage({
  params,
}: PageProps<'/admin/klientai/[email]'>) {
  await requireAdmin()

  const { email } = await params
  // Next.js jau automatiškai decode'ina path segmentus, bet leidžiam
  // decodeURIComponent'ą paleisti antrą kartą saugumo dėlei — jis idempotentiškas
  const decodedEmail = decodeURIComponent(email)

  const customer = await getAdminCustomerByEmail(decodedEmail)
  if (!customer) notFound()

  const displayName =
    customer.companyName ||
    `${customer.firstName} ${customer.lastName}`.trim() ||
    customer.email

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-brand-gray-500">
        <Link
          href="/admin/klientai"
          className="hover:text-brand-magenta transition-colors"
        >
          ← Atgal į klientus
        </Link>
      </div>

      {/* Antraštė su kontaktais */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-brand-gray-900">
                {displayName}
              </h2>
              {customer.isB2b && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                  B2B SALONAS
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-brand-gray-500">El. paštas: </span>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-brand-gray-900 font-medium hover:text-brand-magenta"
                >
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div>
                  <span className="text-brand-gray-500">Telefonas: </span>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-brand-gray-900 font-medium hover:text-brand-magenta"
                  >
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.companyName && (
                <div>
                  <span className="text-brand-gray-500">Įmonė: </span>
                  <span className="text-brand-gray-900 font-medium">
                    {customer.companyName}
                  </span>
                </div>
              )}
              {customer.companyCode && (
                <div>
                  <span className="text-brand-gray-500">Įmonės kodas: </span>
                  <span className="text-brand-gray-900 font-medium font-mono">
                    {customer.companyCode}
                  </span>
                </div>
              )}
              {customer.vatCode && (
                <div>
                  <span className="text-brand-gray-500">PVM kodas: </span>
                  <span className="text-brand-gray-900 font-medium font-mono">
                    {customer.vatCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI kortelės */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            LTV
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {formatCents(customer.totalSpentCents)}
          </div>
          <div className="mt-0.5 text-[11px] text-brand-gray-500">
            Be atšauktų / grąžintų
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Užsakymų
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {customer.orderCount}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Vid. krepšelis
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {formatCents(customer.avgOrderValueCents)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Klientas nuo
          </div>
          <div className="mt-1.5 text-sm font-semibold text-brand-gray-900">
            {formatDateOnly(customer.firstOrderAt)}
          </div>
          <div className="mt-0.5 text-[11px] text-brand-gray-500">
            Paskut.: {formatDateOnly(customer.lastOrderAt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Užsakymų istorija (plati) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#eee]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              Užsakymų istorija
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Nr.</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Pristatymas</th>
                  <th className="px-4 py-3 text-center w-[60px]">Prekės</th>
                  <th className="px-4 py-3 text-right">Suma</th>
                  <th className="px-4 py-3 text-center w-[120px]">Būsena</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/uzsakymai/${o.id}`}
                        className="font-mono text-[13px] font-semibold text-brand-gray-900 hover:text-brand-magenta"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                      {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                      <div className="text-[10px] text-brand-gray-500">
                        {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-brand-gray-500">
                      {o.itemCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                      {formatCents(o.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ORDER_STATUS_COLORS[o.status]}`}
                      >
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pristatymo adresai (šoninė) */}
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
            Pristatymo adresai
          </h3>
          {customer.deliveryAddresses.length === 0 ? (
            <div className="text-sm text-brand-gray-500">
              Nėra užfiksuotų adresų (tik atsiėmimai).
            </div>
          ) : (
            <div className="space-y-3">
              {customer.deliveryAddresses.map((addr, i) => (
                <div
                  key={i}
                  className="p-3 bg-[#F9F9FB] border border-[#eee] rounded-lg"
                >
                  <div className="text-sm text-brand-gray-900">
                    {addr.address && (
                      <div className="font-medium">{addr.address}</div>
                    )}
                    {(addr.city || addr.postalCode) && (
                      <div className="text-brand-gray-500 text-[12px] mt-0.5">
                        {addr.postalCode} {addr.city}
                        {addr.country && addr.country !== 'LT'
                          ? `, ${addr.country}`
                          : ''}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-brand-gray-500">
                    Naudota {addr.usedCount}{' '}
                    {addr.usedCount === 1 ? 'kartą' : 'kartus'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-[#eee]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-2">
              Greiti veiksmai
            </div>
            <div className="space-y-2">
              <a
                href={`mailto:${customer.email}`}
                className="block w-full px-3 py-2 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[12px] font-semibold text-brand-gray-900 transition-colors text-center"
              >
                Rašyti el. laišką
              </a>
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="block w-full px-3 py-2 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[12px] font-semibold text-brand-gray-900 transition-colors text-center"
                >
                  Skambinti
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
