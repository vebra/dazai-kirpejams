import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { PrintButton } from './PrintButton'

export const metadata = { title: 'Sandėlio likučiai (spausdinti)' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })

export default async function PrintStockPage({
  searchParams,
}: {
  searchParams: Promise<{ active?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams
  const activeOnly = sp.active === '1'
  const products = await getAdminProducts({ onlyActive: activeOnly })
  // Pirštinės — visada sąrašo apačioje (pagalbinė prekė, ne dažai).
  const isGlove = (p: { nameLt: string }) =>
    p.nameLt.toLowerCase().includes('pirštin')
  products.sort((a, b) => {
    const ga = isGlove(a) ? 1 : 0
    const gb = isGlove(b) ? 1 : 0
    if (ga !== gb) return ga - gb
    return (
      (a.categoryNameLt ?? '').localeCompare(b.categoryNameLt ?? '', 'lt') ||
      a.nameLt.localeCompare(b.nameLt, 'lt')
    )
  })

  const totalUnits = products.reduce((s, p) => s + (p.stockQuantity ?? 0), 0)

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
              @page { margin: 0.7cm; size: A4; }
              /* Sutankinta lentelė — telpa į max 2 lapus */
              .stock-table { font-size: 9.5px !important; line-height: 1.15 !important; }
              .stock-table th, .stock-table td {
                padding-top: 1px !important;
                padding-bottom: 1px !important;
              }
              .stock-header h1 { font-size: 15px !important; }
              .stock-header { padding-bottom: 4px !important; margin-bottom: 6px !important; }
              .stock-header .meta { margin-top: 2px !important; font-size: 10px !important; }
              .stock-footer { margin-top: 6px !important; padding-top: 3px !important; font-size: 8px !important; }
            }
          `,
        }}
      />

      <div className="print-page max-w-4xl mx-auto bg-white">
        <div className="print-hide mb-4 flex items-center justify-between gap-2">
          <Link
            href="/admin/sandelis"
            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
          >
            ← Atgal
          </Link>
          <div className="flex items-center gap-2">
            {/* Visi / Tik aktyvūs perjungiklis */}
            <div className="flex rounded-lg border border-[#ddd] overflow-hidden text-[12px] font-semibold">
              <Link
                href="/admin/sandelis/spausdinti"
                className={`px-3 py-1.5 ${!activeOnly ? 'bg-brand-magenta text-white' : 'bg-white text-brand-gray-900 hover:bg-[#F5F5F7]'}`}
              >
                Visi
              </Link>
              <Link
                href="/admin/sandelis/spausdinti?active=1"
                className={`px-3 py-1.5 border-l border-[#ddd] ${activeOnly ? 'bg-brand-magenta text-white' : 'bg-white text-brand-gray-900 hover:bg-[#F5F5F7]'}`}
              >
                Tik aktyvūs
              </Link>
            </div>
            <a
              href="/admin/sandelis/eksportas"
              className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#eee] border border-[#ddd] text-brand-gray-900 rounded-lg text-sm font-semibold transition-colors"
              download
            >
              ⬇ Atsisiųsti CSV
            </a>
            <PrintButton />
          </div>
        </div>

        <header className="stock-header border-b border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold">
            Sandėlio likučiai{activeOnly ? ' (tik aktyvūs)' : ''}
          </h1>
          <div className="meta mt-3 flex items-center justify-between text-sm">
            <div>
              Prekių: <strong>{products.length}</strong> · Iš viso vienetų:{' '}
              <strong>{totalUnits}</strong>
            </div>
            <div>
              Atspausdinta:{' '}
              {new Date().toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="text-sm">Produktų nėra.</div>
        ) : (
          <table className="stock-table w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-2 w-[28px]">#</th>
                <th className="py-2 pr-2">Pavadinimas</th>
                <th className="py-2 pr-2 w-[90px]">SKU</th>
                <th className="py-2 pr-2 w-[120px]">Kategorija</th>
                <th className="py-2 pr-2 text-right w-[70px]">Kaina</th>
                <th className="py-2 pr-2 text-right w-[70px]">Likutis</th>
                <th className="py-2 pr-2 text-center w-[80px]">Suskaič.</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-300 align-top">
                  <td className="py-1.5 pr-2 tabular-nums">{i + 1}</td>
                  <td className="py-1.5 pr-2">
                    {p.nameLt}
                    {!p.isActive && (
                      <span className="ml-1 text-[10px] text-gray-500">(neaktyvus)</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2 font-mono text-[11px]">{p.sku ?? '—'}</td>
                  <td className="py-1.5 pr-2 text-[11px]">{p.categoryNameLt ?? '—'}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {PRICE.format(p.priceCents / 100)}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">
                    {p.stockQuantity}
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <span className="inline-block w-12 border-b border-gray-400">&nbsp;</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="stock-footer mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
          Color SHOCK · Dažai Kirpėjams · Sandėlio inventorizacija
        </footer>
      </div>
    </>
  )
}
