import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { ReceivingScanner } from './ReceivingScanner'

export const metadata = { title: 'Prekių priėmimas' }
export const dynamic = 'force-dynamic'

export default async function ReceivingPage() {
  await requireAdmin()
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/sandelis" className="text-[13px] text-brand-gray-500 hover:text-brand-magenta">
          ← Atgal į sandėlį
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-brand-gray-900">Prekių priėmimas</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Skenuokite atvykusių prekių barkodus — likutis sandėlyje didės automatiškai
          (+1 kiekvienam skanavimui).
        </p>
      </div>
      <ReceivingScanner />
    </div>
  )
}
