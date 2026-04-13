import { requireAdmin } from '@/lib/admin/auth'
import { getBanners } from '@/lib/admin/queries'
import { BannersTable } from './BannersTable'

export const metadata = {
  title: 'Baneriai',
}

export const dynamic = 'force-dynamic'

export default async function AdminBannersPage() {
  await requireAdmin()

  const banners = await getBanners()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Baneriai
      </h1>
      <BannersTable banners={banners} />
    </div>
  )
}
