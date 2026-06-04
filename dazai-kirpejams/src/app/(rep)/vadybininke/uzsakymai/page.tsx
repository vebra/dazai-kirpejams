import { requireSalesRep } from '@/lib/rep/auth'
import { getMyRepOrders } from '@/lib/rep/queries'
import { APPROVAL_LABELS, APPROVAL_BADGE } from '@/lib/rep/types'

export const metadata = { title: 'Mano užsakymai' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short', timeStyle: 'short' })

export default async function RepOrdersPage() {
  await requireSalesRep()
  const orders = await getMyRepOrders()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Mano užsakymai</h1>
      <p className="text-sm text-brand-gray-500 mb-6">
        Jūsų pateikti užsakymai ir jų būsena. Naujausi viršuje.
      </p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-12 text-center text-sm text-brand-gray-500">
          Dar nepateikėte nė vieno užsakymo.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[13px] font-bold text-brand-gray-900">
                      {o.orderNumber}
                    </span>
                    {o.approvalStatus && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${APPROVAL_BADGE[o.approvalStatus]}`}
                      >
                        {APPROVAL_LABELS[o.approvalStatus]}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] text-brand-gray-500">
                    {DATE.format(new Date(o.createdAt))} · {o.clientName ?? '—'} · {o.itemCount} prek.
                  </div>
                  {o.approvalStatus === 'rejected' && o.rejectionReason && (
                    <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
                      Atmesta: {o.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="font-semibold text-brand-gray-900 whitespace-nowrap">
                  {PRICE.format(o.totalCents / 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
