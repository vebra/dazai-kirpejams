import { requireSalesRep } from '@/lib/rep/auth'
import { getMyClients, getRepOrderProducts } from '@/lib/rep/queries'
import { getCompanyInfo } from '@/lib/admin/queries'
import {
  DELIVERY_METHODS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  vatRateFromVatCode,
} from '@/lib/commerce/constants'
import { NewOrderFlow } from './NewOrderFlow'

export const metadata = { title: 'Naujas užsakymas' }
export const dynamic = 'force-dynamic'

const DELIVERY_LABELS: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
}

export default async function NewRepOrderPage() {
  await requireSalesRep()

  const [clients, products, company] = await Promise.all([
    getMyClients(),
    getRepOrderProducts(),
    getCompanyInfo().catch(() => null),
  ])
  // PVM tarifas iš įmonės PVM kodo (tas pats šaltinis kaip viešas checkout).
  // Ne PVM mokėtojas → 0. Peržiūra atitiks serverio apskaičiavimą.
  const vatRate = vatRateFromVatCode(company?.vatCode)

  const deliveryOptions = (
    Object.keys(DELIVERY_METHODS) as Array<keyof typeof DELIVERY_METHODS>
  ).map((key) => ({
    value: key as string,
    label: DELIVERY_LABELS[key] ?? key,
    priceCents: DELIVERY_METHODS[key].priceCents,
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
        freeShippingThresholdCents={FREE_SHIPPING_THRESHOLD_CENTS}
        vatRate={vatRate}
      />
    </div>
  )
}
