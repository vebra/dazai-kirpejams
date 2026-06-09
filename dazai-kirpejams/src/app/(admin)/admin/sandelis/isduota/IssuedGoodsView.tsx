'use client'

import { useState } from 'react'
import type { RepIssuanceDay } from '@/lib/admin/rep-reports'

type Rep = { id: string; name: string }

const DATE_FMT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function IssuedGoodsView({
  reps,
  issuancesByRep,
}: {
  reps: Rep[]
  issuancesByRep: Record<string, RepIssuanceDay[]>
}) {
  const [repId, setRepId] = useState('')
  const repName = reps.find((r) => r.id === repId)?.name ?? ''
  const days = repId ? issuancesByRep[repId] ?? [] : []
  const grandTotal = days.reduce(
    (s, d) => s + d.items.reduce((ss, i) => ss + i.qty, 0),
    0
  )
  const printedAt = DATE_FMT.format(new Date())

  return (
    <div className="space-y-5">
      <div className="print-hide flex items-end gap-3 flex-wrap">
        <div>
          <label
            htmlFor="rep"
            className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
          >
            Vadybininkė
          </label>
          <select
            id="rep"
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="w-full md:w-80 px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          >
            <option value="" disabled>
              — Pasirinkite —
            </option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {repId && days.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            🖨 Spausdinti
          </button>
        )}
      </div>

      {!repId ? (
        <div className="print-hide px-4 py-8 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
          Pasirinkite vadybininkę — bus parodyti jos išdavimai pagal dieną.
        </div>
      ) : days.length === 0 ? (
        <div className="print-hide px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          Šiai vadybininkei nieko nebuvo išduota.
        </div>
      ) : (
        <div className="print-area bg-white">
          <header className="border-b border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold">Vadybininkei išduotos prekės</h1>
            <div className="mt-3 flex items-center justify-between text-sm flex-wrap gap-2">
              <div>
                Vadybininkė: <strong>{repName}</strong>
              </div>
              <div>Spausdinta: {printedAt}</div>
            </div>
          </header>

          {days.map((d) => {
            const dayTotal = d.items.reduce((s, i) => s + i.qty, 0)
            return (
              <div key={d.date} className="mb-6">
                <h2 className="text-[13px] font-bold mb-1.5 bg-[#F2F2F4] px-2 py-1 rounded">
                  Išduota: {d.date}
                </h2>
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-black text-left">
                      <th className="py-1.5 pr-2 w-[28px]">#</th>
                      <th className="py-1.5 pr-2">Prekė</th>
                      <th className="py-1.5 pr-2 text-right w-[90px]">Kiekis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((i, idx) => (
                      <tr key={i.productId} className="border-b border-gray-200">
                        <td className="py-1 pr-2 tabular-nums">{idx + 1}</td>
                        <td className="py-1 pr-2">
                          {i.colorNumber ? `${i.colorNumber} · ` : ''}
                          {i.name}
                          {i.sku ? (
                            <span className="text-gray-500 font-mono text-[11px]">
                              {' '}
                              · {i.sku}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1 pr-2 text-right tabular-nums font-semibold">
                          {i.qty}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-black font-bold">
                      <td className="py-1.5 pr-2" colSpan={2}>
                        Dienos suma
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">
                        {dayTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}

          <div className="border-t-2 border-black pt-2 flex items-center justify-between font-bold text-sm">
            <span>Iš viso išduota vienetų</span>
            <span className="tabular-nums">{grandTotal}</span>
          </div>

          <footer className="mt-10 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
            Color SHOCK · Dažai Kirpėjams · Vadybininkei išduotų prekių ataskaita
          </footer>
        </div>
      )}
    </div>
  )
}
