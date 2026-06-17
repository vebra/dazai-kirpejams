import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminProducts,
  getAdminCustomerByEmail,
  getCompanyInfo,
  getShippingSettings,
} from '@/lib/admin/queries'
import { vatRateFromVatCode } from '@/lib/commerce/constants'
import { NewOrderForm, type NewOrderPrefill } from './NewOrderForm'

export const metadata: Metadata = { title: 'Naujas užsakymas' }

export default async function NewAdminOrderPage({
  searchParams,
}: PageProps<'/admin/uzsakymai/naujas'>) {
  await requireAdmin()
  const sp = await searchParams
  const klientas = typeof sp.klientas === 'string' ? sp.klientas : undefined

  const [products, company, shipping, customer] = await Promise.all([
    getAdminProducts(),
    getCompanyInfo().catch(() => null),
    getShippingSettings(),
    klientas ? getAdminCustomerByEmail(klientas).catch(() => null) : null,
  ])
  const activeProducts = products.filter((p) => p.isActive)
  // PVM tarifas pagal MŪSŲ įmonės PVM kodą (ne kliento). Nėra kodo → 0.
  const vatRate = vatRateFromVatCode(company?.vatCode)

  // Esamo kliento duomenys užpildomi iš naujausio užsakymo + daugiausiai
  // naudoto pristatymo adreso.
  const topAddress = customer?.deliveryAddresses?.[0]
  const prefill: NewOrderPrefill | undefined = customer
    ? {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        isCompany: customer.isB2b || Boolean(customer.companyName),
        companyName: customer.companyName,
        companyCode: customer.companyCode,
        vatCode: customer.vatCode,
        address: topAddress?.address ?? null,
        city: topAddress?.city ?? null,
        postal: topAddress?.postalCode ?? null,
      }
    : undefined

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
          {prefill && (
            <p className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-lg text-[13px] font-semibold">
              Klientas užpildytas: {prefill.firstName} {prefill.lastName} ·{' '}
              {prefill.email}
            </p>
          )}
        </div>
        <Link
          href="/admin/uzsakymai"
          className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
        >
          ← Atgal į užsakymus
        </Link>
      </div>

      <NewOrderForm
        products={activeProducts}
        vatRate={vatRate}
        freeShippingThresholdCents={shipping.freeShippingThresholdCents}
        shippingPriceCents={{
          courier: shipping.courierCents,
          parcel_locker: shipping.parcelLockerCents,
          pickup: shipping.pickupCents,
        }}
        prefill={prefill}
      />
    </div>
  )
}
