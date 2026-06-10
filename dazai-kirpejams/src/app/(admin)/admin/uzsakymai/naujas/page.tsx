import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { NewOrderForm } from './NewOrderForm'

export const metadata: Metadata = { title: 'Naujas užsakymas' }

export default async function NewAdminOrderPage() {
  await requireAdmin()
  const products = (await getAdminProducts()).filter((p) => p.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Naujas užsakymas
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Sukurkite užsakymą klientui (telefonu / el. paštu). Klientas gaus
            laišką su banko rekvizitais ir suma.
          </p>
        </div>
        <Link
          href="/admin/uzsakymai"
          className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
        >
          ← Atgal į užsakymus
        </Link>
      </div>

      <NewOrderForm products={products} />
    </div>
  )
}
