'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TIER_LABELS, type PendingRepOrder } from '@/lib/admin/rep-orders-shared'
import {
  approveRepOrder,
  approveRepOrderFromWarehouse,
  rejectRepOrder,
  removeRepOrderLine,
} from './actions'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short', timeStyle: 'short' })
const fmt = (c: number) => PRICE.format(c / 100)

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

export function PendingApprovals({ orders }: { orders: PendingRepOrder[] }) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState<PendingRepOrder | null>(null)

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-16 text-center">
        <div className="text-4xl mb-3" aria-hidden>
          ✅
        </div>
        <p className="text-sm text-brand-gray-500">
          Nėra užsakymų, laukiančių patvirtinimo.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onRejectClick={() => setRejecting(o)}
            onDone={() => router.refresh()}
          />
        ))}
      </div>

      {rejecting && (
        <RejectModal
          order={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function OrderCard({
  order: o,
  onRejectClick,
  onDone,
}: {
  order: PendingRepOrder
  onRejectClick: () => void
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<'approve' | 'warehouse' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleApprove() {
    setError(null)
    setBusy('approve')
    startTransition(async () => {
      const res = await approveRepOrder(o.id)
      if (res.ok) onDone()
      else {
        setError(res.error ?? 'Nepavyko patvirtinti.')
        setBusy(null)
      }
    })
  }

  function handleApproveFromWarehouse() {
    setError(null)
    setBusy('warehouse')
    startTransition(async () => {
      const res = await approveRepOrderFromWarehouse(o.id)
      if (res.ok) onDone()
      else {
        setError(res.error ?? 'Nepavyko patvirtinti iš sandėlio.')
        setBusy(null)
      }
    })
  }

  function handleRemoveLine(productId: string | null, name: string) {
    if (!productId) return
    if (!confirm(`Pašalinti „${name}" iš užsakymo?`)) return
    setError(null)
    startTransition(async () => {
      const res = await removeRepOrderLine(o.id, productId)
      if (res.ok) onDone()
      else setError(res.error ?? 'Nepavyko pašalinti prekės.')
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Antraštė */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-5 py-4 border-b border-[#f0f0f0] bg-[#FbFbFc]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[13px] font-bold text-brand-gray-900">
              {o.orderNumber}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
              Laukia patvirtinimo
            </span>
          </div>
          <div className="mt-1 text-[12px] text-brand-gray-500">
            {DATE.format(new Date(o.createdAt))}
            {o.repName && (
              <>
                {' · '}Pateikė: <span className="font-medium text-brand-gray-900">{o.repName}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="font-semibold text-brand-gray-900">
            {o.clientName ?? '— klientas nenurodytas —'}
          </div>
          {o.clientTier && (
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
              {TIER_LABELS[o.clientTier] ?? o.clientTier}
            </span>
          )}
        </div>
      </div>

      {/* Prekės */}
      <div className="px-5 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              <th className="pb-2 text-left">Prekė</th>
              <th className="pb-2 text-center w-[60px]">Kiekis</th>
              <th className="pb-2 text-right w-[110px]">Vnt. kaina</th>
              <th className="pb-2 text-right w-[110px]">Suma</th>
              <th className="pb-2 w-[36px]"></th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it, idx) => (
              <tr key={idx} className="border-t border-[#f3f3f3]">
                <td className="py-2">
                  <div className="font-medium text-brand-gray-900">{it.productName}</div>
                  {it.productSku && (
                    <div className="text-[11px] text-brand-gray-400 font-mono">{it.productSku}</div>
                  )}
                </td>
                <td className="py-2 text-center text-brand-gray-600">{it.quantity}</td>
                <td className="py-2 text-right text-brand-gray-600">{fmt(it.unitPriceCents)}</td>
                <td className="py-2 text-right font-medium text-brand-gray-900">{fmt(it.totalCents)}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(it.productId, it.productName)}
                    disabled={pending}
                    title="Pašalinti šią prekę iš užsakymo"
                    className="text-brand-gray-300 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sumos + pristatymas */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="text-[12px] text-brand-gray-500 space-y-0.5">
            <div>
              Pristatymas: {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
              {o.deliveryCity ? ` · ${o.deliveryCity}` : ''}
            </div>
            <div>Mokėjimas: {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}</div>
            {o.notes && <div>Pastaba: {o.notes}</div>}
          </div>
          <div className="text-sm text-right space-y-0.5 min-w-[180px]">
            <div className="flex justify-between gap-6 text-brand-gray-600">
              <span>Tarpinė suma</span>
              <span>{fmt(o.subtotalCents)}</span>
            </div>
            <div className="flex justify-between gap-6 text-brand-gray-600">
              <span>Pristatymas</span>
              <span>{fmt(o.deliveryCents)}</span>
            </div>
            <div className="flex justify-between gap-6 text-brand-gray-600">
              <span>PVM</span>
              <span>{fmt(o.vatCents)}</span>
            </div>
            <div className="flex justify-between gap-6 font-bold text-brand-gray-900 border-t border-[#eee] pt-1 mt-1">
              <span>Iš viso</span>
              <span>{fmt(o.totalCents)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Klaida + veiksmai */}
      {error && (
        <div className="mx-5 mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#f0f0f0] bg-[#FbFbFc]">
        <button
          type="button"
          onClick={onRejectClick}
          disabled={pending}
          className="px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded-lg font-semibold text-[13px] hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50"
        >
          Atmesti
        </button>
        <button
          type="button"
          onClick={handleApproveFromWarehouse}
          disabled={pending}
          title="Nurašyti iš centrinio sandėlio (kai prekės nebuvo išduotos vadybininkei)"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-[13px] hover:bg-[#F5F5F7] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          {busy === 'warehouse' && (
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden
            />
          )}
          {busy === 'warehouse' ? 'Tvirtinama…' : 'Iš sandėlio'}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending}
          title="Nurašyti iš vadybininkės atsargų"
          className="inline-flex items-center gap-2 px-5 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-[13px] hover:bg-brand-magenta-dark active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          {busy === 'approve' && (
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden
            />
          )}
          {busy === 'approve' ? 'Tvirtinama…' : 'Patvirtinti (iš atsargų)'}
        </button>
      </div>
    </div>
  )
}

function RejectModal({
  order: o,
  onClose,
  onDone,
}: {
  order: PendingRepOrder
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (reason.trim().length === 0) {
      setError('Nurodykite atmetimo priežastį.')
      return
    }
    startTransition(async () => {
      const res = await rejectRepOrder(o.id, reason)
      if (res.ok) onDone()
      else setError(res.error ?? 'Nepavyko atmesti.')
    })
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 border-b border-[#eee]">
            <h3 className="text-lg font-bold text-brand-gray-900">Atmesti užsakymą</h3>
            <p className="mt-1 text-[13px] text-brand-gray-500">
              {o.orderNumber}
              {o.clientName ? ` · ${o.clientName}` : ''}. Sandėlis nebus paliestas.
            </p>
          </div>
          <div className="px-5 py-4">
            <label
              htmlFor="reject-reason"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Atmetimo priežastis *
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Pvz. nebėra prekės, neteisinga spalva, klientas atšaukė…"
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
            {error && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
                {error}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#eee]">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="px-4 py-2 border border-[#ddd] rounded-lg font-semibold text-[13px] text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
            >
              Atšaukti
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold text-[13px] hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {pending ? 'Atmetama…' : 'Atmesti užsakymą'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
