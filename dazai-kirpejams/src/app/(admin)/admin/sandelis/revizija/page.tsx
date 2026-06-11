import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { RevizijaForm } from './RevizijaForm'

export const metadata: Metadata = { title: 'Revizija' }

export default async function RevizijaPage() {
  await requireAdmin()
  const products = (await getAdminProducts({ sortBy: 'name' })).filter(
    (p) => p.isActive
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Sandėlio revizija
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500 max-w-2xl">
            Suskaičiuokite faktinį likutį skenuodami kiekvieną prekę. Pabaigoje
            pamatysite neatitikimus ir tik patvirtinę pritaikysite. Neskaičiuotų
            prekių likučiai NEKEIČIAMI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sandelis/revizija/istorija"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-[13px] hover:bg-[#F5F5F7] transition-colors"
          >
            📜 Istorija
          </Link>
          <Link
            href="/admin/sandelis"
            className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            ← Atgal į sandėlį
          </Link>
        </div>
      </div>

      <RevizijaForm products={products} />
    </div>
  )
}
