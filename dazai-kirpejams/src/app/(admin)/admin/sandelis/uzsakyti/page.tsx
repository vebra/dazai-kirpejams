import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { quickSetReorderAction } from '../actions'

export const metadata = { title: 'Ką užsakyti' }
export const dynamic = 'force-dynamic'

export default async function ReorderPage() {
  await requireAdmin()
  const all = await getAdminProducts({ sortBy: 'name' })
  const active = all.filter((p) => p.isActive)

  const isLow = (p: (typeof active)[number]) =>
    p.reorderPoint != null && p.reorderPoint > 0 && p.stockQuantity <= p.reorderPoint

  const low = active.filter(isLow)
  // Rikiuojam: pirma reikiantys užsakyti (pagal trūkumą), tada likę
  const sorted = [...active].sort((a, b) => {
    const la = isLow(a) ? 0 : 1
    const lb = isLow(b) ? 0 : 1
    if (la !== lb) return la - lb
    return a.nameLt.localeCompare(b.nameLt, 'lt')
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">Ką užsakyti</h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Nustatykite perspėjimo ribą kiekvienai prekei. Kai likutis pasiekia
            ribą — prekė pažymima „Užsakyti".
          </p>
        </div>
        <Link
          href="/admin/sandelis"
          className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          ← Sandelis
        </Link>
      </div>

      <div
        className={`px-5 py-4 rounded-xl border text-sm font-semibold ${
          low.length > 0
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}
      >
        {low.length > 0
          ? `⚠️ Reikia užsakyti: ${low.length} prek(ės)`
          : '✓ Visų prekių likučiai virš ribos'}
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-4 py-3 text-left">Prekė</th>
                <th className="px-4 py-3 text-right w-[90px]">Likutis</th>
                <th className="px-4 py-3 text-center w-[220px]">Perspėjimo riba</th>
                <th className="px-4 py-3 text-center w-[120px]">Būsena</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const lowRow = isLow(p)
                return (
                  <tr
                    key={p.id}
                    className={`border-t border-[#eee] ${lowRow ? 'bg-red-50/40' : 'hover:bg-[#F9F9FB]'} transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-gray-900">
                        {p.nameLt}
                      </div>
                      <div className="text-[11px] text-brand-gray-400 font-mono">
                        {p.colorNumber ?? p.sku ?? ''}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${lowRow ? 'text-red-600' : 'text-brand-gray-900'}`}
                    >
                      {p.stockQuantity}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={quickSetReorderAction}
                        className="flex items-center justify-center gap-2"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="number"
                          name="reorder_point"
                          min={0}
                          step={1}
                          defaultValue={p.reorderPoint ?? ''}
                          placeholder="—"
                          className="w-20 px-2 py-1.5 border border-[#ddd] rounded-md text-sm text-center focus:outline-none focus:border-brand-magenta"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[11px] font-semibold text-brand-gray-900 transition-colors"
                        >
                          Išsaugoti
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lowRow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-50 text-red-700 border-red-200">
                          Užsakyti
                        </span>
                      ) : p.reorderPoint != null && p.reorderPoint > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          OK
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[12px] text-brand-gray-500">
        Palikus ribos lauką tuščią ir išsaugojus — perspėjimas išjungiamas tai prekei.
      </p>
    </div>
  )
}
