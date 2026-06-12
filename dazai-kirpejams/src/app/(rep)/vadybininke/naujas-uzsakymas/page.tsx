import { requireSalesRep } from '@/lib/rep/auth'
import {
  getMyClients,
  getRepOrderProducts,
  getMyRepOrderDetail,
} from '@/lib/rep/queries'
import { getCompanyInfo, getShippingSettings } from '@/lib/admin/queries'
import {
  deliveryPriceCents,
  vatRateFromVatCode,
  type DeliveryMethod,
} from '@/lib/commerce/constants'
import { NewOrderFlow } from './NewOrderFlow'

export const metadata = { title: 'Naujas užsakymas' }
export const dynamic = 'force-dynamic'

const DELIVERY_LABELS: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
}

export default async function NewRepOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ repeat?: string; preke?: string }>
}) {
  await requireSalesRep()

  const [clients, products, company, shipping] = await Promise.all([
    getMyClients(),
    getRepOrderProducts(),
    getCompanyInfo().catch(() => null),
    getShippingSettings(),
  ])

  // Pakartojimas: ?repeat=orderId — užpildom klientą ir prekes iš seno užsakymo.
  const sp = await searchParams
  const repeatId = typeof sp.repeat === 'string' ? sp.repeat : null
  let initialClientId: string | null = null
  let initialCart: Record<string, number> | undefined
  if (repeatId) {
    const det = await getMyRepOrderDetail(repeatId)
    if (det) {
      initialClientId = det.clientId
      initialCart = {}
      for (const it of det.items) {
        if (it.productId) initialCart[it.productId] = (initialCart[it.productId] ?? 0) + it.quantity
      }
    }
  }
  // „Parduoti" iš Mano atsargų: ?preke=productId — prekė iškart krepšelyje.
  const prekeId = typeof sp.preke === 'string' ? sp.preke : null
  if (prekeId && !initialCart && products.some((p) => p.id === prekeId)) {
    initialCart = { [prekeId]: 1 }
  }
  // PVM tarifas iš įmonės PVM kodo (tas pats šaltinis kaip viešas checkout).
  // Ne PVM mokėtojas → 0. Peržiūra atitiks serverio apskaičiavimą.
  const vatRate = vatRateFromVatCode(company?.vatCode)

  const deliveryOptions = (
    ['courier', 'parcel_locker', 'pickup'] as DeliveryMethod[]
  ).map((key) => ({
    value: key as string,
    label: DELIVERY_LABELS[key] ?? key,
    priceCents: deliveryPriceCents(key, shipping),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-1">Naujas užsakymas</h1>
      <p className="text-sm text-brand-gray-500 mb-6">
        Pasirinkite klientą, sudėkite prekes ir pateikite — užsakymas bus perduotas
        administratoriui patvirtinti.
      </p>
      <NewOrderFlow
        clients={clients}
        products={products}
        deliveryOptions={deliveryOptions}
        freeShippingThresholdCents={shipping.freeShippingThresholdCents}
        vatRate={vatRate}
        initialClientId={initialClientId}
        initialCart={initialCart}
      />
    </div>
  )
}
