import { requireSalesRep } from '@/lib/rep/auth'
import { getMyInventory } from '@/lib/rep/queries'

export const metadata = { title: 'Mano atsargos' }
export const dynamic = 'force-dynamic'

const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short' })

export default async function RepInventoryPage() {
  await requireSalesRep()
  const rows = await getMyInventory()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Mano atsargos</h1>
      <p className="text-sm text-brand-gray-500 mb-6">
        Prekės, kurios jums išduotos iš sandėlio prekiauti.
      </p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-12 text-center text-sm text-brand-gray-500">
          Jums dar nieko neišduota iš sandėlio.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Prekė</th>
                  <th className="px-4 py-3 text-right w-[110px]">Turima</th>
                  <th className="px-4 py-3 text-left w-[130px]">Paskutinį kartą</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.productId} className="border-t border-[#eee]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-gray-900">{r.name}</div>
                      <div className="text-[11px] text-brand-gray-400 font-mono">
                        {r.colorNumber ?? r.sku ?? ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-gray-900">
                      {r.issued} vnt.
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                      {DATE.format(new Date(r.lastAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mt-3 text-[12px] text-brand-gray-500">
        Rodoma, kiek prekių šiuo metu turite (išduota minus grąžinta). Grąžinus
        prekes administracijai, likutis sumažėja.
      </p>
    </div>
  )
}
