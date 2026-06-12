import { requireSalesRep } from '@/lib/rep/auth'
import { getMyStockSummary, getMyStockMovements } from '@/lib/rep/queries'
import { AtsargosView } from './AtsargosView'

export const metadata = { title: 'Mano atsargos' }
export const dynamic = 'force-dynamic'

export default async function RepInventoryPage() {
  await requireSalesRep()
  const [summary, movements] = await Promise.all([
    getMyStockSummary(),
    getMyStockMovements(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Mano atsargos</h1>
        <p className="text-sm text-brand-gray-500">
          Jūsų prekės: kiek turite dabar, o paspaudus prekę — visa jos istorija.
        </p>
      </div>
      <AtsargosView summary={summary} movements={movements} />
    </div>
  )
}
