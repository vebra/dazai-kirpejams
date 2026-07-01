import { requireSalesRep } from '@/lib/rep/auth'
import { getRepOrderProducts, getMyIssueRequests } from '@/lib/rep/queries'
import { IssueRequestFlow } from './IssueRequestFlow'

export const metadata = { title: 'Išvežimas prekybai' }
export const dynamic = 'force-dynamic'

export default async function RepIssueRequestPage() {
  await requireSalesRep()
  const [products, requests] = await Promise.all([
    getRepOrderProducts(),
    getMyIssueRequests(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Išvežimas prekybai</h1>
      <p className="text-sm text-brand-gray-500 mb-6">
        Sudarykite prekių sąrašą, kurį norite pasiimti prekybai. Pateikus, prašymą
        patvirtins administratorius — tada prekės atsiras jūsų skiltyje „Mano atsargos&quot;.
        Neparduotas vėliau grąžinsite.
      </p>
      <IssueRequestFlow
        products={products.map((p) => ({
          id: p.id,
          nameLt: p.nameLt,
          sku: p.sku,
          colorNumber: p.colorNumber,
          stockQuantity: p.stockQuantity,
        }))}
        requests={requests}
      />
    </div>
  )
}
