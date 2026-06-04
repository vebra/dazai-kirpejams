import { requireAdmin } from '@/lib/admin/auth'
import { getProductsWithWholesalePrices } from '@/lib/admin/queries'
import { WholesalePricesTable } from './WholesalePricesTable'

export const metadata = { title: 'Didmeninės kainos' }
export const dynamic = 'force-dynamic'

export default async function WholesalePricesPage() {
  await requireAdmin()
  const rows = await getProductsWithWholesalePrices()

  const withPrices = rows.filter((r) => Object.keys(r.prices).length > 0).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Didmeninės kainos</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Kainos vadybininkių klientams pagal grupę (Didmena I / II / III). Naudojamos
          tik vadybininkės užsakymuose — vieša svetainė rodo įprastą (retail) kainą.
          Nustatyta: <strong>{withPrices}</strong> iš {rows.length} prekių.
        </p>
      </div>
      <WholesalePricesTable rows={rows} />
    </div>
  )
}
