import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getPendingIssueRequests } from '@/lib/admin/queries'
import { IssueRequests } from './IssueRequests'

export const metadata = { title: 'Išvežimo prašymai' }
export const dynamic = 'force-dynamic'

export default async function IssueRequestsPage() {
  await requireAdmin()
  const requests = await getPendingIssueRequests()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Išvežimo prašymai
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Vadybininkių prašymai pasiimti prekių prekybai. Patvirtinus, prekės
            nurašomos iš sandėlio į jos atsargas.
          </p>
        </div>
        <Link
          href="/admin/sandelis"
          className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          ← Sandelis
        </Link>
      </div>

      <IssueRequests requests={requests} />
    </div>
  )
}
