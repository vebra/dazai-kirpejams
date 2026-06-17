import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { deleteSupplierOrderAction } from '../../actions'

export const metadata = { title: 'Tiekėjo užsakymų istorija' }
export const dynamic = 'force-dynamic'

type DetailItem = {
  productId: string
  name: string
  nameEn: string | null
  colorNumber: string | null
  sku: string | null
  ean: string | null
  stockAtOrder: number
  qty: number
}

type SupplierOrderRow = {
  id: string
  created_at: string
  status: string
  note: string | null
  item_count: number
  total_qty: number
  details: DetailItem[]
}

const DT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function SupplierOrderHistoryPage() {
  await requireAdmin()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('supplier_orders')
    .select('id, created_at, status, note, item_count, total_qty, details')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('[uzsakyti/istorija]', error.message)
  const orders = (data ?? []) as SupplierOrderRow[]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Tiekėjo užsakymų istorija
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Kada ir kiek buvo užsakyta iš tiekėjo. Iš viso įrašų: {orders.length}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sandelis/uzsakyti/lapas"
            className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
          >
            + Naujas užsakymas
          </Link>
          <Link
            href="/admin/sandelis/uzsakyti"
            className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
          >
            ← Ką užsakyti
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#eee] p-8 text-center text-sm text-brand-gray-500">
          Dar nėra išsaugotų užsakymų tiekėjui. Sukurkite pirmą per „Užsakymo
          lapas tiekėjui“.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <details
              key={o.id}
              className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden group"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none hover:bg-[#F9F9FB] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-brand-gray-400 text-xs group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-brand-gray-900">
                      {DT.format(new Date(o.created_at))}
                    </div>
                    {o.note && (
                      <div className="text-[12px] text-brand-gray-500 truncate">
                        {o.note}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                  <span className="text-brand-gray-500">
                    {o.item_count} prek.
                  </span>
                  <span className="font-bold text-brand-gray-900 tabular-nums">
                    {o.total_qty} vnt.
                  </span>
                </div>
              </summary>

              <div className="border-t border-[#eee] px-4 py-3 flex items-center gap-2 flex-wrap bg-[#FbFbFd]">
                <Link
                  href={`/admin/sandelis/uzsakyti/lapas?redaguoti=${o.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-magenta text-white rounded-lg text-[13px] font-semibold hover:bg-brand-magenta-dark transition-colors"
                >
                  ✏ Atidaryti (redaguoti · PDF · spausdinti)
                </Link>
                <form action={deleteSupplierOrderAction} className="ml-auto">
                  <input type="hidden" name="id" value={o.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#ddd] text-brand-gray-500 rounded-lg text-[13px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    🗑 Ištrinti
                  </button>
                </form>
              </div>

              <div className="border-t border-[#eee] overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                      <th className="px-4 py-2 text-left">Prekė</th>
                      <th className="px-4 py-2 text-left w-[120px]">SKU / EAN</th>
                      <th className="px-4 py-2 text-center w-[90px]">
                        Likutis tada
                      </th>
                      <th className="px-4 py-2 text-center w-[80px]">Užsakyta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.details.map((d, idx) => (
                      <tr key={idx} className="border-t border-[#eee]">
                        <td className="px-4 py-2 text-brand-gray-900">
                          {d.colorNumber ? `${d.colorNumber} · ` : ''}
                          {d.name}
                        </td>
                        <td className="px-4 py-2 font-mono text-[11px] text-brand-gray-500">
                          {d.sku ?? d.ean ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-center tabular-nums text-brand-gray-500">
                          {d.stockAtOrder}
                        </td>
                        <td className="px-4 py-2 text-center tabular-nums font-bold text-brand-gray-900">
                          {d.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
