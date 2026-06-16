import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { SupplierOrderForm } from './SupplierOrderForm'

export const metadata = { title: 'Supplier order sheet' }
export const dynamic = 'force-dynamic'

/**
 * Užsakymo lapas tiekėjui — pildomas svetainėje (kiekiai įvedami, lapas
 * išsaugomas į istoriją). Rodom prekes, pasiekusias perspėjimo ribą arba
 * baigusias (0). Baigusios (0) prekės — viršuje, pažymėtos raudonai.
 */
export default async function SupplierOrderSheetPage() {
  await requireAdmin()
  const all = await getAdminProducts({ sortBy: 'name' })
  const active = all.filter((p) => p.isActive)
  const isOut = (p: (typeof all)[number]) => p.stockQuantity <= 0
  // Žemo likučio / baigusios prekės — pridedamos į lapą iš karto (0 — viršuje).
  const presetIds = active
    .filter(
      (p) =>
        isOut(p) ||
        (p.reorderPoint != null &&
          p.reorderPoint > 0 &&
          p.stockQuantity <= p.reorderPoint)
    )
    .sort((a, b) => {
      const oa = isOut(a) ? 0 : 1
      const ob = isOut(b) ? 0 : 1
      if (oa !== ob) return oa - ob
      return a.nameLt.localeCompare(b.nameLt, 'lt')
    })
    .map((p) => p.id)
  const today = new Date().toLocaleDateString('en-GB')

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              aside, [data-admin-sidebar], header[data-admin-topbar],
              .admin-sidebar, .admin-topbar { display: none !important; }
              .print-page { padding: 0 !important; margin: 0 !important; max-width: none !important; }
              .print-hide { display: none !important; }
              @page { margin: 1cm; size: A4; }
            }
          `,
        }}
      />
      <SupplierOrderForm
        products={active}
        presetIds={presetIds}
        today={today}
      />
    </>
  )
}
