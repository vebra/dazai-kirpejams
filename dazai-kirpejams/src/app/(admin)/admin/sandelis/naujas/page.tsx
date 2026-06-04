import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminCategories } from '@/lib/admin/queries'
import { NewProductForm } from './NewProductForm'

export const metadata = { title: 'Naujas produktas' }
export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  await requireAdmin()
  const categories = await getAdminCategories()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/sandelis" className="text-[13px] text-brand-gray-500 hover:text-brand-magenta">
          ← Atgal į sandėlį
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-brand-gray-900">Naujas produktas</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Užpildykite pagrindinę informaciją. Nuotraukas ir didmenos kainas pridėsite
          po sukūrimo, produkto redagavimo lange.
        </p>
      </div>
      <NewProductForm categories={categories} />
    </div>
  )
}
