import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getOwnUseReport } from '@/lib/admin/queries'
import { PrintButton } from '@/components/admin/PrintButton'

export const metadata: Metadata = { title: 'Savo naudojimui — ataskaita' }

function eur(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

/** YYYY-MM-DD šios dienos / mėnesio pradžios (Vilniaus laiku pakanka UTC datos). */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default async function OwnUseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const from = sp.from || isoDate(monthStart)
  // „to" imtinai — pridedam dieną, kad įtrauktų visą paskutinę dieną.
  const toInput = sp.to || isoDate(now)
  const toExclusive = new Date(toInput + 'T00:00:00Z')
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)

  const report = await getOwnUseReport(
    from + 'T00:00:00Z',
    toExclusive.toISOString()
  )

  return (
    <div className="space-y-6">
      <div className="print-hide flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Savo naudojimui — ataskaita
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Savininkės sunaudotos prekės saloniniam darbui (veiklos sąnaudos,
            savikaina).
          </p>
        </div>
        <Link
          href="/admin/sandelis/savo-naudojimui"
          className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
        >
          ← Atgal
        </Link>
      </div>

      {/* Datų filtras */}
      <form
        method="get"
        className="print-hide bg-white rounded-xl border border-[#eee] p-4 flex items-end gap-3 flex-wrap"
      >
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">Nuo</label>
          <input type="date" name="from" defaultValue={from} className="px-3 py-2 border border-[#ddd] rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">Iki</label>
          <input type="date" name="to" defaultValue={toInput} className="px-3 py-2 border border-[#ddd] rounded-lg text-sm" />
        </div>
        <button type="submit" className="px-5 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark">
          Rodyti
        </button>
        <PrintButton className="px-5 py-2 bg-white border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#F5F5F7]" />
      </form>

      {/* Ataskaita */}
      <div className="print-area bg-white rounded-xl border border-[#eee] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#eee] flex items-center justify-between">
          <span className="font-bold text-brand-gray-900">
            Sunaudota {from} – {toInput}
          </span>
          <span className="text-sm text-brand-gray-500">
            {report.totalQty} vnt. · {eur(report.totalValueCents)}
          </span>
        </div>
        {report.rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-brand-gray-400">
            Per šį laikotarpį savo naudojimui prekių nesunaudota.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-3 py-2 text-left">Prekė</th>
                <th className="px-3 py-2 text-center w-20">Kiekis</th>
                <th className="px-3 py-2 text-right w-28">Savikaina/vnt</th>
                <th className="px-3 py-2 text-right w-28">Vertė</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.productId} className="border-t border-[#eee]">
                  <td className="px-3 py-2 text-brand-gray-900">
                    {r.colorNumber ? `${r.colorNumber} · ` : ''}{r.name}
                    {r.sku && <span className="text-[11px] text-brand-gray-400 font-mono ml-1">{r.sku}</span>}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold">{r.qty}</td>
                  <td className="px-3 py-2 text-right text-brand-gray-500">
                    {r.costCents != null ? eur(r.costCents) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{eur(r.valueCents)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-bold">
                <td className="px-3 py-2">Iš viso</td>
                <td className="px-3 py-2 text-center">{report.totalQty}</td>
                <td />
                <td className="px-3 py-2 text-right">{eur(report.totalValueCents)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
