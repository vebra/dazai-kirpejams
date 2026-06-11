import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { PrintButton } from '@/components/admin/PrintButton'

export const metadata = { title: 'Užsakymo lapas tiekėjui' }
export const dynamic = 'force-dynamic'

/**
 * Spausdinamas užsakymo lapas tiekėjui: prekės, pasiekusios perspėjimo ribą,
 * su siūlomu kiekiu (papildyti iki dvigubos ribos) ir tuščiu stulpeliu
 * rankiniam koregavimui. Atspausdinai / išsisaugojai PDF — išsiuntei tiekėjui.
 */
export default async function SupplierOrderSheetPage() {
  await requireAdmin()
  const all = await getAdminProducts({ sortBy: 'name' })
  const low = all.filter(
    (p) =>
      p.isActive &&
      p.reorderPoint != null &&
      p.reorderPoint > 0 &&
      p.stockQuantity <= p.reorderPoint
  )
  const suggested = (p: (typeof low)[number]) =>
    Math.max((p.reorderPoint ?? 0) * 2 - p.stockQuantity, 1)
  const totalSuggested = low.reduce((s, p) => s + suggested(p), 0)
  const today = new Date().toLocaleDateString('lt-LT')

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; }
              aside, [data-admin-sidebar], header[data-admin-topbar],
              .admin-sidebar, .admin-topbar { display: none !important; }
              .print-page { padding: 0 !important; margin: 0 !important; max-width: none !important; }
              .print-hide { display: none !important; }
              @page { margin: 1cm; size: A4; }
            }
          `,
        }}
      />

      <div className="print-page max-w-3xl mx-auto bg-white">
        <div className="print-hide mb-4 flex items-center justify-between gap-2">
          <Link
            href="/admin/sandelis/uzsakyti"
            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
          >
            ← Atgal
          </Link>
          <PrintButton className="px-4 py-2 bg-brand-magenta text-white rounded-lg text-sm font-semibold hover:bg-brand-magenta-dark" />
        </div>

        <header className="border-b border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold">Užsakymas tiekėjui</h1>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              Pozicijų: <strong>{low.length}</strong> · Siūloma iš viso:{' '}
              <strong>{totalSuggested} vnt.</strong>
            </div>
            <div>Data: {today}</div>
          </div>
        </header>

        {low.length === 0 ? (
          <div className="text-sm">
            Visų prekių likučiai virš ribos — užsakyti nieko nereikia. 👍
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-2 w-[28px]">#</th>
                <th className="py-2 pr-2">Prekė</th>
                <th className="py-2 pr-2 w-[110px]">SKU / EAN</th>
                <th className="py-2 pr-2 text-center w-[60px]">Likutis</th>
                <th className="py-2 pr-2 text-center w-[80px]">Siūloma</th>
                <th className="py-2 pr-2 text-center w-[90px]">Užsakyta</th>
              </tr>
            </thead>
            <tbody>
              {low.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="py-1.5 pr-2 tabular-nums">{i + 1}</td>
                  <td className="py-1.5 pr-2">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameLt}
                  </td>
                  <td className="py-1.5 pr-2 font-mono text-[11px]">
                    {p.sku ?? p.ean ?? '—'}
                  </td>
                  <td className="py-1.5 pr-2 text-center tabular-nums">
                    {p.stockQuantity}
                  </td>
                  <td className="py-1.5 pr-2 text-center tabular-nums font-bold">
                    {suggested(p)}
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <span className="inline-block w-16 border-b border-gray-400">
                      &nbsp;
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
          Dažai Kirpėjams · Užsakymas tiekėjui · Siūlomas kiekis = papildyti iki
          dvigubos perspėjimo ribos
        </footer>
      </div>
    </>
  )
}
