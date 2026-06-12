import { requireSalesRep } from '@/lib/rep/auth'
import { getMyStockSummary, getMyStockMovements } from '@/lib/rep/queries'
import type { RepStockMovementRow } from '@/lib/rep/queries'

export const metadata = { title: 'Mano atsargos' }
export const dynamic = 'force-dynamic'

const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short' })
const DATE_TIME = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const REASON_LABELS: Record<
  RepStockMovementRow['reason'],
  { label: string; sign: '+' | '−'; cls: string }
> = {
  issue_to_rep: {
    label: 'Išduota iš sandėlio',
    sign: '+',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  return_from_rep: {
    label: 'Grąžinta į sandėlį',
    sign: '−',
    cls: 'bg-amber-50 text-amber-700',
  },
  rep_sale: {
    label: 'Parduota klientui',
    sign: '−',
    cls: 'bg-blue-50 text-blue-700',
  },
  rep_sale_cancel: {
    label: 'Pardavimas atšauktas',
    sign: '+',
    cls: 'bg-gray-100 text-gray-600',
  },
}

export default async function RepInventoryPage() {
  await requireSalesRep()
  const [summary, movements] = await Promise.all([
    getMyStockSummary(),
    getMyStockMovements(),
  ])

  const totals = summary.reduce(
    (t, r) => ({
      taken: t.taken + r.taken,
      returned: t.returned + r.returned,
      sold: t.sold + r.sold,
      onHand: t.onHand + r.onHand,
    }),
    { taken: 0, returned: 0, sold: 0, onHand: 0 }
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Mano atsargos</h1>
        <p className="text-sm text-brand-gray-500">
          Visos jums išduotos prekės: kiek paėmėte, grąžinote, pardavėte ir kiek
          turite dabar.
        </p>
      </div>

      {summary.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-12 text-center text-sm text-brand-gray-500">
          Jums dar nieko neišduota iš sandėlio.
        </div>
      ) : (
        <>
          {/* Suvestinė per prekę — mobilios kortelės */}
          <div className="sm:hidden bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <ul className="divide-y divide-[#f3f3f3]">
              {summary.map((r) => (
                <li key={r.productId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-brand-gray-900 text-[13px]">{r.name}</div>
                    <div className="mt-0.5 text-[11px] text-brand-gray-500">
                      Paimta {r.taken}
                      {r.returned > 0 && <> · Grąžinta {r.returned}</>}
                      {r.sold > 0 && <> · Parduota {r.sold}</>}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 text-right tabular-nums font-bold ${
                      r.onHand > 0 ? 'text-brand-gray-900' : 'text-brand-gray-400'
                    }`}
                  >
                    {r.onHand}
                    <span className="ml-0.5 text-[11px] font-semibold text-brand-gray-400">vnt.</span>
                  </div>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F9F9FB] font-bold text-brand-gray-900 text-[13px]">
                <span>
                  Iš viso · paimta {totals.taken} · grąžinta {totals.returned} · parduota {totals.sold}
                </span>
                <span className="tabular-nums">{totals.onHand} vnt.</span>
              </li>
            </ul>
          </div>

          {/* Suvestinė per prekę — desktop lentelė */}
          <div className="hidden sm:block bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                    <th className="px-4 py-3 text-left">Prekė</th>
                    <th className="px-4 py-3 text-right w-[90px]">Paimta</th>
                    <th className="px-4 py-3 text-right w-[90px]">Grąžinta</th>
                    <th className="px-4 py-3 text-right w-[90px]">Parduota</th>
                    <th className="px-4 py-3 text-right w-[100px]">Turima</th>
                    <th className="px-4 py-3 text-left w-[120px]">Paskutinis</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((r) => (
                    <tr key={r.productId} className="border-t border-[#eee]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-brand-gray-900">{r.name}</div>
                        <div className="text-[11px] text-brand-gray-400 font-mono">
                          {r.colorNumber ?? r.sku ?? ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.taken}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-brand-gray-500">
                        {r.returned || '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-brand-gray-500">
                        {r.sold || '—'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-bold ${
                          r.onHand > 0 ? 'text-brand-gray-900' : 'text-brand-gray-400'
                        }`}
                      >
                        {r.onHand}
                      </td>
                      <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                        {DATE.format(new Date(r.lastAt))}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#ddd] bg-[#F9F9FB] font-bold text-brand-gray-900">
                    <td className="px-4 py-3">Iš viso</td>
                    <td className="px-4 py-3 text-right tabular-nums">{totals.taken}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{totals.returned}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{totals.sold}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{totals.onHand}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Judėjimų žurnalas */}
          <div>
            <h2 className="text-lg font-bold text-brand-gray-900 mb-1">
              Judėjimų istorija
            </h2>
            <p className="text-[12px] text-brand-gray-500 mb-3">
              Kiekvienas išdavimas, grąžinimas ir pardavimas (naujausi viršuje).
            </p>
            {/* Mobilios kortelės */}
            <div className="sm:hidden bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <ul className="divide-y divide-[#f3f3f3]">
                {movements.map((m, i) => {
                  const r = REASON_LABELS[m.reason]
                  const isOrder = m.reason === 'rep_sale' || m.reason === 'rep_sale_cancel'
                  return (
                    <li key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${r.cls}`}
                        >
                          {r.label}
                        </span>
                        <span
                          className={`tabular-nums font-bold ${
                            r.sign === '+' ? 'text-emerald-700' : 'text-brand-gray-900'
                          }`}
                        >
                          {r.sign}
                          {m.qty}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[13px] text-brand-gray-900">
                        {m.colorNumber ? `${m.colorNumber} · ` : ''}
                        {m.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-brand-gray-500">
                        {DATE_TIME.format(new Date(m.createdAt))}
                        {isOrder && m.source && (
                          <span className="font-mono"> · {m.source}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Desktop lentelė */}
            <div className="hidden sm:block bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                      <th className="px-4 py-3 text-left w-[130px]">Data</th>
                      <th className="px-4 py-3 text-left w-[180px]">Veiksmas</th>
                      <th className="px-4 py-3 text-left">Prekė</th>
                      <th className="px-4 py-3 text-right w-[90px]">Kiekis</th>
                      <th className="px-4 py-3 text-left w-[160px]">Dokumentas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m, i) => {
                      const r = REASON_LABELS[m.reason]
                      const isOrder = m.reason === 'rep_sale' || m.reason === 'rep_sale_cancel'
                      return (
                        <tr key={i} className="border-t border-[#eee]">
                          <td className="px-4 py-2.5 text-brand-gray-500 text-[12px] whitespace-nowrap">
                            {DATE_TIME.format(new Date(m.createdAt))}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${r.cls}`}
                            >
                              {r.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-brand-gray-900">
                              {m.colorNumber ? `${m.colorNumber} · ` : ''}
                              {m.name}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                              r.sign === '+' ? 'text-emerald-700' : 'text-brand-gray-900'
                            }`}
                          >
                            {r.sign}
                            {m.qty}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] text-brand-gray-500 font-mono">
                            {isOrder ? m.source : 'Sandėlis'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
