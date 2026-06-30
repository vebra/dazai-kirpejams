'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminIssueRequest } from '@/lib/admin/queries'
import { approveIssueRequest, rejectIssueRequest } from './actions'

const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short', timeStyle: 'short' })

export function IssueRequests({ requests }: { requests: AdminIssueRequest[] }) {
  const router = useRouter()

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-16 text-center">
        <div className="text-4xl mb-3" aria-hidden>
          ✅
        </div>
        <p className="text-sm text-brand-gray-500">Nėra laukiančių išvežimo prašymų.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <RequestCard key={r.id} req={r} onDone={() => router.refresh()} />
      ))}
    </div>
  )
}

function RequestCard({
  req,
  onDone,
}: {
  req: AdminIssueRequest
  onDone: () => void
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [sheet, setSheet] = useState<{
    rep: string
    at: string
    items: { name: string; qty: number; balance: number }[]
  } | null>(null)
  const units = req.items.reduce((s, i) => s + i.qty, 0)

  function approve() {
    setError(null)
    start(async () => {
      const res = await approveIssueRequest(req.id)
      if (res.ok) {
        if (res.issued) setSheet(res.issued)
        else onDone()
      } else setError(res.error ?? 'Nepavyko patvirtinti.')
    })
  }

  // Po patvirtinimo — spausdinamas išvežimo lapas.
  if (sheet) {
    const total = sheet.items.reduce((s, i) => s + i.qty, 0)
    return (
      <div>
        <div className="print-hide mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            🖨 Spausdinti
          </button>
          <button
            type="button"
            onClick={onDone}
            className="px-5 py-2.5 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors"
          >
            Uždaryti
          </button>
        </div>

        <div className="print-area max-w-3xl bg-white">
          <header className="border-b border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold">Prekių išvežimo lapas</h1>
            <div className="mt-3 flex items-center justify-between text-sm flex-wrap gap-2">
              <div>
                Vadybininkė: <strong>{sheet.rep}</strong>
              </div>
              <div>Data: {DATE.format(new Date(sheet.at))}</div>
            </div>
          </header>

          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-2 w-[28px]">#</th>
                <th className="py-2 pr-2">Prekė</th>
                <th className="py-2 pr-2 text-right w-[90px]">Išduota</th>
                <th className="py-2 pr-2 text-right w-[120px]">Liko sandėlyje</th>
              </tr>
            </thead>
            <tbody>
              {sheet.items.map((i, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="py-1.5 pr-2 tabular-nums">{idx + 1}</td>
                  <td className="py-1.5 pr-2">{i.name}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">{i.qty}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{i.balance}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-bold">
                <td className="py-2 pr-2" colSpan={2}>
                  Iš viso
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">{total}</td>
                <td />
              </tr>
            </tbody>
          </table>

          <div className="mt-12 grid grid-cols-2 gap-8 text-[12px]">
            <div className="border-t border-gray-400 pt-1.5">Išdavė (parašas)</div>
            <div className="border-t border-gray-400 pt-1.5">Priėmė (parašas)</div>
          </div>

          <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
            Color SHOCK · Dažai Kirpėjams · Prekių išvežimas vadybininkei
          </footer>
        </div>
      </div>
    )
  }

  function reject() {
    setError(null)
    if (!reason.trim()) {
      setError('Nurodykite atmetimo priežastį.')
      return
    }
    start(async () => {
      const res = await rejectIssueRequest(req.id, reason)
      if (res.ok) onDone()
      else setError(res.error ?? 'Nepavyko atmesti.')
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#f0f0f0] bg-[#FbFbFc] flex-wrap">
        <div>
          <div className="font-semibold text-brand-gray-900">{req.repName}</div>
          <div className="text-[12px] text-brand-gray-500">
            {DATE.format(new Date(req.createdAt))} · {units} vnt.
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
          Laukia
        </span>
      </div>

      <div className="px-5 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              <th className="pb-2 text-left">Prekė</th>
              <th className="pb-2 text-right w-[80px]">Kiekis</th>
            </tr>
          </thead>
          <tbody>
            {req.items.map((it, idx) => (
              <tr key={idx} className="border-t border-[#f3f3f3]">
                <td className="py-2 text-brand-gray-900">{it.name}</td>
                <td className="py-2 text-right text-brand-gray-700 tabular-nums">{it.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {req.note && (
          <div className="mt-3 text-[13px] text-brand-gray-600">Pastaba: {req.note}</div>
        )}
      </div>

      {error && (
        <div className="mx-5 mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {rejecting ? (
        <div className="px-5 py-3 border-t border-[#f0f0f0] bg-[#FbFbFc] space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            autoFocus
            placeholder="Atmetimo priežastis (pvz. nėra likučio, perteklinis kiekis)…"
            className="w-full px-3 py-2 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              disabled={pending}
              className="px-4 py-2 border border-[#ddd] rounded-lg font-semibold text-[13px] text-brand-gray-900 hover:bg-[#F5F5F7] disabled:opacity-50"
            >
              Atšaukti
            </button>
            <button
              type="button"
              onClick={reject}
              disabled={pending}
              className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold text-[13px] hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? 'Atmetama…' : 'Atmesti'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#f0f0f0] bg-[#FbFbFc]">
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={pending}
            className="px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded-lg font-semibold text-[13px] hover:bg-red-50 disabled:opacity-50"
          >
            Atmesti
          </button>
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            className="px-5 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-[13px] hover:bg-brand-magenta-dark disabled:opacity-50"
          >
            {pending ? 'Tvirtinama…' : 'Patvirtinti ir išduoti'}
          </button>
        </div>
      )}
    </div>
  )
}
