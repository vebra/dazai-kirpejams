import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { ReceiveOrderClient, type ReceiveItem } from './ReceiveOrderClient'

export const metadata = { title: 'Užsakymo priėmimas' }
export const dynamic = 'force-dynamic'

type DetailItem = {
  productId: string
  name: string
  nameEn: string | null
  colorNumber: string | null
  sku: string | null
  ean: string | null
  stockAtOrder: number
  qty: number
  received?: number
}

const DT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function SupplierOrderReceivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('supplier_orders')
    .select('id, created_at, note, details')
    .eq('id', id)
    .maybeSingle()

  if (error) console.error('[uzsakyti/istorija/[id]]', error.message)
  if (!data) notFound()

  const details = (data.details ?? []) as DetailItem[]
  const initialItems: ReceiveItem[] = details.map((d) => ({
    productId: d.productId,
    name: d.name,
    colorNumber: d.colorNumber,
    sku: d.sku,
    ean: d.ean,
    qty: d.qty,
    received: d.received ?? 0,
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-[13px] text-brand-gray-500">
        <Link
          href="/admin/sandelis/uzsakyti/istorija"
          className="hover:text-brand-magenta transition-colors"
        >
          ← Atgal į užsakymų istoriją
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Užsakymo priėmimas
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Užsakyta {DT.format(new Date(data.created_at))}
          {data.note ? ` · ${data.note}` : ''}. Skenuokite atvažiavusias prekes —
          sistema sutikrins su užsakymu ir parodys, ko trūksta.
        </p>
      </div>

      <ReceiveOrderClient orderId={data.id} initialItems={initialItems} />
    </div>
  )
}
