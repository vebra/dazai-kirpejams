import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSalesRep } from '@/lib/rep/auth'
import { getMyRepOrderDetail } from '@/lib/rep/queries'
import { APPROVAL_LABELS, APPROVAL_BADGE } from '@/lib/rep/types'
import { CancelOrderButton } from './CancelOrderButton'

export const metadata = { title: 'Užsakymas' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short', timeStyle: 'short' })
const PAYMENT: Record<string, string> = {
  cash: 'Grynais',
  card: 'Kortelė',
  bank_transfer: 'Pavedimas',
  stripe: 'Kortelė',
  paysera: 'Paysera',
}

export default async function RepOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSalesRep()
  const { id } = await params
  const o = await getMyRepOrderDetail(id)
  if (!o) notFound()

  return (
    <div className="max-w-2xl">
      <Link
        href="/vadybininke/uzsakymai"
        className="text-[13px] text-brand-gray-500 hover:text-brand-magenta"
      >
        ← Mano užsakymai
      </Link>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-gray-900 font-mono">{o.orderNumber}</h1>
        {o.approvalStatus && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${APPROVAL_BADGE[o.approvalStatus]}`}
          >
            {APPROVAL_LABELS[o.approvalStatus]}
          </span>
        )}
      </div>
      <div className="mt-1 text-[13px] text-brand-gray-500">
        {DATE.format(new Date(o.createdAt))} · {o.clientName ?? '—'} ·{' '}
        {PAYMENT[o.paymentMethod] ?? o.paymentMethod}
      </div>

      {o.approvalStatus === 'rejected' && o.rejectionReason && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
          Atmesta: {o.rejectionReason}
        </div>
      )}
      {o.notes && (
        <div className="mt-3 px-3 py-2 bg-[#F9F9FB] border border-[#eee] rounded-lg text-[13px] text-brand-gray-600 whitespace-pre-line">
          <span className="font-semibold text-brand-gray-900">Pastaba: </span>
          {o.notes}
        </div>
      )}

      <div className="mt-4 bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              <th className="px-4 py-3 text-left">Prekė</th>
              <th className="px-4 py-3 text-center w-[60px]">Kiekis</th>
              <th className="px-4 py-3 text-right w-[100px]">Vnt.</th>
              <th className="px-4 py-3 text-right w-[110px]">Suma</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it, i) => (
              <tr key={i} className="border-t border-[#eee]">
                <td className="px-4 py-3 text-brand-gray-900">{it.name}</td>
                <td className="px-4 py-3 text-center">{it.quantity}</td>
                <td className="px-4 py-3 text-right text-brand-gray-500">
                  {PRICE.format(it.unitPriceCents / 100)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                  {PRICE.format(it.totalCents / 100)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#F9F9FB]">
            <tr className="border-t border-[#eee]">
              <td colSpan={3} className="px-4 py-3 text-right font-bold text-brand-gray-900">
                Iš viso
              </td>
              <td className="px-4 py-3 text-right font-bold text-brand-gray-900 text-base">
                {PRICE.format(o.totalCents / 100)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {o.approvalStatus === 'pending' && (
        <div className="mt-4">
          <CancelOrderButton orderId={o.id} />
          <p className="mt-1 text-[12px] text-brand-gray-500">
            Atšaukti galima tik kol užsakymas laukia patvirtinimo.
          </p>
        </div>
      )}
    </div>
  )
}
