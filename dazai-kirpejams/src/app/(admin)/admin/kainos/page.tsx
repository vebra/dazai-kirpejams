import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminDiscountCodes,
  getShopSettings,
  getProductsCountByCategory,
} from '@/lib/admin/queries'
import { ShopSettingsForm } from './ShopSettingsForm'
import { DiscountCodesSection } from './DiscountCodesSection'
import { BulkPriceUpdateForm } from './BulkPriceUpdateForm'

export const metadata = {
  title: 'Kainos ir nuolaidos',
}

export const dynamic = 'force-dynamic'

export default async function AdminPricingPage({
  searchParams,
}: PageProps<'/admin/kainos'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined

  const errorMessage =
    errorParam === 'invalid-id'
      ? 'Trūksta ID.'
      : errorParam === 'update-failed'
        ? 'Nepavyko atnaujinti.'
        : errorParam === 'delete-failed'
          ? 'Nepavyko ištrinti.'
          : null

  // Paraleliai gaunam visus duomenis — jie nepriklausomi
  const [settings, discountCodes, categories] = await Promise.all([
    getShopSettings(),
    getAdminDiscountCodes(),
    getProductsCountByCategory(),
  ])

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Antraštė */}
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Kainos ir nuolaidos
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Nuolaidų kodai, pristatymo kainos, masinis kainų atnaujinimas.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* 1. Nuolaidų kodai */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="pb-4 border-b border-[#eee]">
          <h3 className="text-lg font-bold text-brand-gray-900">
            Nuolaidų kodai
          </h3>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Kuponai, kuriuos klientai įveda krepšelyje. Procentinės arba
            fiksuotos sumos nuolaidos.
          </p>
        </div>

        <DiscountCodesSection codes={discountCodes} />
      </section>

      {/* 2. Parduotuvės nustatymai */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="pb-4 border-b border-[#eee]">
          <h3 className="text-lg font-bold text-brand-gray-900">
            Pristatymas ir krepšelis
          </h3>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Pristatymo kainos kiekvienam metodui, nemokamo pristatymo riba ir
            minimali užsakymo suma.
          </p>
        </div>

        <ShopSettingsForm settings={settings} />
      </section>

      {/* 3. Masinis kainų atnaujinimas */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="pb-4 border-b border-[#eee]">
          <h3 className="text-lg font-bold text-brand-gray-900">
            Masinis kainų atnaujinimas
          </h3>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Procentinis arba fiksuotas kainos keitimas visai kategorijai —
            naudojama po tiekėjo kainoraščio pasikeitimo.
          </p>
        </div>

        <BulkPriceUpdateForm categories={categories} />
      </section>
    </div>
  )
}
