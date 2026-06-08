import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSalesRep } from '@/lib/rep/auth'
import { getClientWithOrders } from '@/lib/rep/queries'
import { APPROVAL_LABELS, APPROVAL_BADGE } from '@/lib/rep/types'

export const metadata = { title: 'Klientas' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short' })

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSalesRep()
  const { id } = await params
  const data = await getClientWithOrders(id)
  if (!data) notFound()
  const { client, orders } = data

  return (
    <div className="max-w-2xl">
      <Link
        href="/vadybininke/klientai"
        className="text-[13px] text-brand-gray-500 hover:text-brand-magenta"
      >
        ← Klientai
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-brand-gray-900">{client.name}</h1>
      <div className="mt-1 text-[13px] text-brand-gray-500">
        {client.phone ?? '—'}
        {client.email ? ` · ${client.email}` : ''}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-brand-gray-900">
          Užsakymų istorija ({orders.length})
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="mt-3 bg-white rounded-xl border border-[#eee] px-6 py-10 text-center text-sm text-brand-gray-500">
          Šis klientas dar neturi užsakymų.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/vadybininke/uzsakymai/${o.id}`}
                      className="font-mono text-[13px] font-bold text-brand-gray-900 hover:text-brand-magenta"
                    >
                      {o.orderNumber}
                    </Link>
                    {o.approvalStatus && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${APPROVAL_BADGE[o.approvalStatus]}`}
                      >
                        {APPROVAL_LABELS[o.approvalStatus]}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] text-brand-gray-500">
                    {DATE.format(new Date(o.createdAt))} · {o.itemCount} prek. ·{' '}
                    {PRICE.format(o.totalCents / 100)}
                  </div>
                </div>
                <Link
                  href={`/vadybininke/naujas-uzsakymas?repeat=${o.id}`}
                  className="shrink-0 px-3 py-1.5 bg-brand-magenta text-white rounded-lg text-[12px] font-semibold hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
                >
                  ↻ Pakartoti
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
