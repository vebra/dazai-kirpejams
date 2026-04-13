import { requireAdmin } from '@/lib/admin/auth'
import { getNewsletterSubscribers } from '@/lib/admin/queries'
import { SubscribersTable } from './SubscribersTable'

export const metadata = {
  title: 'Naujienlaiškiai',
}

export const dynamic = 'force-dynamic'

export default async function AdminNewsletterPage() {
  await requireAdmin()

  const subscribers = await getNewsletterSubscribers()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Naujienlaiškiai
      </h1>
      <SubscribersTable subscribers={subscribers} />
    </div>
  )
}
