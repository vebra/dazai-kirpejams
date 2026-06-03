import { requireAdmin } from '@/lib/admin/auth'
import { getPendingRepOrders } from '@/lib/admin/queries'
import { PendingApprovals } from './PendingApprovals'

export const metadata = {
  title: 'Patvirtinimai',
}

export const dynamic = 'force-dynamic'

export default async function AdminApprovalsPage() {
  await requireAdmin()
  const orders = await getPendingRepOrders()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Patvirtinimai{orders.length > 0 ? ` (${orders.length})` : ''}
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Vadybininkių pateikti užsakymai, laukiantys patvirtinimo. Patvirtinus
          prekės nuskaitomos iš sandėlio; atmetus — sandėlis nepaliečiamas.
        </p>
      </div>

      <PendingApprovals orders={orders} />
    </div>
  )
}
