import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { getRepManagementData } from '@/lib/admin/rep-reports'
import { IssueToRepForm } from './IssueToRepForm'

export const metadata = { title: 'Išdavimas vadybininkei' }
export const dynamic = 'force-dynamic'

export default async function IssueToRepPage() {
  await requireAdmin()
  const [products, repData] = await Promise.all([
    getAdminProducts({ sortBy: 'name' }),
    getRepManagementData(),
  ])
  const reps = repData.reps.map((r) => ({ id: r.id, name: r.name }))

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Prekių išdavimas vadybininkei
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Prekės išvežamos iš sandėlio vadybininkei prekiauti — likutis
            sumažinamas, įrašoma į žurnalą.
          </p>
        </div>
        <Link
          href="/admin/sandelis"
          className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          ← Sandelis
        </Link>
      </div>

      {reps.length === 0 ? (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          Vadybininkių dar nėra. Sukurkite jas{' '}
          <Link href="/admin/vadybininkes" className="underline font-semibold">
            /admin/vadybininkes
          </Link>{' '}
          skiltyje.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <IssueToRepForm reps={reps} products={products} />
        </div>
      )}
    </div>
  )
}
