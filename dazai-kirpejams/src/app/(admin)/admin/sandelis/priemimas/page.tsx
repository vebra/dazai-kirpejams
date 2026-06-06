import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { ReceivingScanner } from './ReceivingScanner'

export const metadata = { title: 'Prekių priėmimas' }
export const dynamic = 'force-dynamic'

export default async function ReceivingPage() {
  await requireAdmin()
  const products = await getAdminProducts({ sortBy: 'name' })
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/sandelis" className="text-[13px] text-brand-gray-500 hover:text-brand-magenta">
          ← Atgal į sandėlį
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-brand-gray-900">Prekių priėmimas</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Skenuokite barkodus arba pridėkite ranka (prekėms be barkodo). Galite
          nurodyti tiekėją — jis pateks į sandelio žurnalą.
        </p>
      </div>
      <ReceivingScanner products={products} />
    </div>
  )
}
