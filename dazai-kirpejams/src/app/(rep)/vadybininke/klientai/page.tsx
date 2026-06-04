import { requireSalesRep } from '@/lib/rep/auth'
import { getMyClients } from '@/lib/rep/queries'
import { ClientsManager } from './ClientsManager'

export const metadata = { title: 'Klientai' }
export const dynamic = 'force-dynamic'

export default async function RepClientsPage() {
  await requireSalesRep()
  const clients = await getMyClients()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Klientai</h1>
      <p className="text-sm text-brand-gray-500 mb-6">
        Jūsų klientai (salonai, kirpėjai). Kainų grupę nustato administratorius.
      </p>
      <ClientsManager clients={clients} />
    </div>
  )
}
