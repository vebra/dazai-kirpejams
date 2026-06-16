import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { PrintButton } from '@/components/admin/PrintButton'
import { quickSetReorderAction } from '../actions'

export const metadata = { title: 'Ką užsakyti' }
export const dynamic = 'force-dynamic'

export default async function ReorderPage() {
  await requireAdmin()
  const all = await getAdminProducts({ sortBy: 'name' })
  const active = all.filter((p) => p.isActive)

  // Prekė baigėsi (0 likutis) — visada raudona ir visada reikia užsakyti
  const isOut = (p: (typeof active)[number]) => p.stockQuantity <= 0
  // Žemas likutis pagal perspėjimo ribą
  const isLow = (p: (typeof active)[number]) =>
    isOut(p) ||
    (p.reorderPoint != null && p.reorderPoint > 0 && p.stockQuantity <= p.reorderPoint)

  const low = active.filter(isLow)
  const outCount = active.filter(isOut).length
  // Rikiuojam: pirma baigėsi (0), tada žemas likutis, tada likę
  const rank = (p: (typeof active)[number]) => (isOut(p) ? 0 : isLow(p) ? 1 : 2)
  const sorted = [...active].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return a.nameLt.localeCompare(b.nameLt, 'lt')
  })
  const today = new Date().toLocaleDateString('lt-LT')

  return (
    <div className="space-y-6 max-w-5xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-size: 10px !important;
              }
              aside, [data-admin-sidebar], header[data-admin-topbar],
              .admin-sidebar, .admin-topbar { display: none !important; }
              .print-hide { display: none !important; }
              /* Kompaktiškas sąrašas — taupom lapus */
              .reorder-table { font-size: 10px !important; }
              .reorder-table th,
              .reorder-table td {
                padding-top: 1.5px !important;
                padding-bottom: 1.5px !important;
                padding-left: 6px !important;
                padding-right: 6px !important;
                line-height: 1.2 !important;
              }
              /* Spalvos nr. / SKU — į tą pačią eilutę su pavadinimu */
              .reorder-name { display: inline !important; }
              .reorder-meta {
                display: inline !important;
                margin-left: 6px !important;
                font-size: 9px !important;
              }
              .reorder-row { page-break-inside: avoid; }
              thead { display: table-header-group; }
              @page { margin: 0.8cm; size: A4; }
            }
          `,
        }}
      />
      <div className="hidden print:block mb-2">
        <h1 className="text-xl font-bold text-black">Ką užsakyti</h1>
        <div className="text-sm text-black">Data: {today}</div>
      </div>

      <div className="print-hide flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">Ką užsakyti</h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Nustatykite perspėjimo ribą kiekvienai prekei. Kai likutis pasiekia
            ribą — prekė pažymima „Užsakyti“. Baigusios (0) prekės žymimos raudonai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton
            label="🖨 Spausdinti"
            className="px-4 py-2 bg-brand-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-black transition-colors whitespace-nowrap"
          />
          {low.length > 0 && (
            <Link
              href="/admin/sandelis/uzsakyti/lapas"
              className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
            >
              📝 Užsakymo lapas tiekėjui
            </Link>
          )}
          <Link
            href="/admin/sandelis/uzsakyti/istorija"
            className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
          >
            Užsakymų istorija
          </Link>
          <Link
            href="/admin/sandelis"
            className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
          >
            ← Sandelis
          </Link>
        </div>
      </div>

      <div
        className={`px-5 py-4 rounded-xl border text-sm font-semibold ${
          low.length > 0
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}
      >
        {low.length > 0
          ? `⚠️ Reikia užsakyti: ${low.length} prek(ės)` +
            (outCount > 0 ? ` · iš jų baigėsi (0): ${outCount}` : '')
          : '✓ Visų prekių likučiai virš ribos'}
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="reorder-table w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-4 py-3 text-left">Prekė</th>
                <th className="px-4 py-3 text-right w-[90px]">Likutis</th>
                <th className="px-4 py-3 text-center w-[220px] print-hide">
                  Perspėjimo riba
                </th>
                <th className="px-4 py-3 text-center w-[120px]">Būsena</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const lowRow = isLow(p)
                const outRow = isOut(p)
                return (
                  <tr
                    key={p.id}
                    className={`reorder-row border-t border-[#eee] ${
                      outRow
                        ? 'bg-red-100'
                        : lowRow
                          ? 'bg-red-50/40'
                          : 'hover:bg-[#F9F9FB]'
                    } transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div
                        className={`reorder-name font-medium ${outRow ? 'text-red-700 font-bold' : 'text-brand-gray-900'}`}
                      >
                        {p.nameLt}
                      </div>
                      <div className="reorder-meta text-[11px] text-brand-gray-400 font-mono">
                        {p.colorNumber ?? p.sku ?? ''}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${outRow ? 'text-red-700' : lowRow ? 'text-red-600' : 'text-brand-gray-900'}`}
                    >
                      {p.stockQuantity}
                    </td>
                    <td className="px-4 py-3 print-hide">
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
                      {outRow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-600 text-white border-red-700">
                          Baigėsi
                        </span>
                      ) : lowRow ? (
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
      <p className="print-hide text-[12px] text-brand-gray-500">
        Palikus ribos lauką tuščią ir išsaugojus — perspėjimas išjungiamas tai prekei.
      </p>
    </div>
  )
}
