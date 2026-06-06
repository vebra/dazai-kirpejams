import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { WriteOffForm } from './WriteOffForm'

export const metadata = { title: 'Nurašymas' }
export const dynamic = 'force-dynamic'

export default async function WriteOffPage() {
  await requireAdmin()
  const products = await getAdminProducts({ sortBy: 'name' })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Nurašymas / išvežimas
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Sumažinkite likutį dėl broko, pavyzdžių ar rankinio išvežimo.
            Įrašoma į sandelio žurnalą.
          </p>
        </div>
        <Link
          href="/admin/sandelis"
          className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          ← Sandelis
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <WriteOffForm products={products} />
      </div>
    </div>
  )
}
