import { requireAdmin } from '@/lib/admin/auth'
import { getAdminDownloads } from '@/lib/admin/queries'
import { DownloadsManager } from './DownloadsManager'

export const metadata = { title: 'Atsisiuntimai' }
export const dynamic = 'force-dynamic'

export default async function AdminDownloadsPage() {
  await requireAdmin()
  const downloads = await getAdminDownloads()

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Atsisiuntimai</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Failai klientams (kainoraščiai, katalogai, spalvų paletė, instrukcijos).
          Kiekvienam failui: viešas arba tik profesionalams.
        </p>
      </div>
      <DownloadsManager downloads={downloads} />
    </div>
  )
}
