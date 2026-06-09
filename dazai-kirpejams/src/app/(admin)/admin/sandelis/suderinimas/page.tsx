import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getRepReconciliation } from '@/lib/admin/rep-reports'
import { PrintButton } from './PrintButton'

export const metadata = { title: 'Atsargų suderinimas' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const eur = (c: number) => PRICE.format(c / 100)

export default async function ReconciliationPage() {
  await requireAdmin()
  const reps = await getRepReconciliation()
  const withStock = reps.filter((r) => r.rows.length > 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: #fff !important; }
              body * { visibility: hidden !important; }
              .print-area, .print-area * { visibility: visible !important; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; }
              .print-hide { display: none !important; }
              @page { margin: 1.2cm; size: A4; }
            }
          `,
        }}
      />
      <div className="print-hide flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Atsargų suderinimas
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Kiek kiekvienai vadybininkei išduota, parduota, grąžinta ir kiek turi
            dabar. „Turi“ = išduota − parduota − grąžinta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Link
            href="/admin/sandelis"
            className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
          >
            ← Sandelis
          </Link>
        </div>
      </div>

      {withStock.length === 0 ? (
        <div className="print-hide px-4 py-8 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
          Nėra vadybininkių su atsargomis.
        </div>
      ) : (
        <div className="print-area space-y-8">
          <div className="hidden print:block mb-2 text-[11px] text-gray-600">
            Color SHOCK · Dažai Kirpėjams · Atsargų suderinimo ataskaita
          </div>
          {withStock.map((rep) => (
            <div
              key={rep.repId}
              className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border-gray-300"
            >
              <div className="px-4 py-3 bg-[#F9F9FB] border-b border-[#eee] flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-bold text-brand-gray-900">{rep.repName}</h3>
                <div className="text-[13px] text-brand-gray-600">
                  Turi:{' '}
                  <strong className="text-brand-gray-900">{rep.totalHeld} vnt.</strong>{' '}
                  · Vertė:{' '}
                  <strong className="text-brand-gray-900">
                    {eur(rep.totalValueCents)}
                  </strong>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 border-b border-[#eee]">
                      <th className="px-4 py-2.5 text-left">Prekė</th>
                      <th className="px-3 py-2.5 text-center w-[90px]">Išduota</th>
                      <th className="px-3 py-2.5 text-center w-[90px]">Parduota</th>
                      <th className="px-3 py-2.5 text-center w-[90px]">Grąžinta</th>
                      <th className="px-3 py-2.5 text-center w-[80px]">Turi</th>
                      <th className="px-4 py-2.5 text-right w-[100px]">Vertė</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rep.rows.map((r) => (
                      <tr key={r.productId} className="border-b border-[#f0f0f0]">
                        <td className="px-4 py-2">
                          <div className="font-medium text-brand-gray-900">
                            {r.colorNumber ? `${r.colorNumber} · ` : ''}
                            {r.name}
                          </div>
                          {r.sku && (
                            <div className="text-[11px] text-brand-gray-400 font-mono">
                              {r.sku}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-brand-gray-600">
                          {r.issued}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-brand-gray-600">
                          {r.sold}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-brand-gray-600">
                          {r.returned}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums font-bold text-brand-gray-900">
                          {r.held}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-brand-gray-700">
                          {eur(r.valueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#ddd] font-bold text-brand-gray-900">
                      <td className="px-4 py-2.5 text-right" colSpan={4}>
                        Iš viso
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums">
                        {rep.totalHeld}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {eur(rep.totalValueCents)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
