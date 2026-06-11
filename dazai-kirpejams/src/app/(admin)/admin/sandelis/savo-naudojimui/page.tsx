import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { OwnUseForm } from './OwnUseForm'

export const metadata: Metadata = { title: 'Savo naudojimui' }

export default async function OwnUsePage() {
  await requireAdmin()
  const products = (await getAdminProducts({ sortBy: 'name' })).filter(
    (p) => p.isActive
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Savo naudojimui
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500 max-w-2xl">
            Skenuokite prekes, kurias savininkė paima saloniniam darbui. Iš karto
            nurašoma iš sandėlio ir žymima atskirai (ne pardavimas, ne nurašymas).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sandelis/savo-naudojimui/ataskaita"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900"
          >
            📊 Ataskaita (savikaina)
          </Link>
          <Link
            href="/admin/sandelis"
            className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            ← Atgal
          </Link>
        </div>
      </div>

      <OwnUseForm products={products} />
    </div>
  )
}
