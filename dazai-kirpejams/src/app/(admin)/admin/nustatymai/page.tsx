import { requireAdmin } from '@/lib/admin/auth'
import { getCompanyInfo, getAdminUsers } from '@/lib/admin/queries'
import { CompanyInfoForm } from './CompanyInfoForm'
import { AdminsManager } from './AdminsManager'

export const metadata = {
  title: 'Nustatymai',
}

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage({
  searchParams,
}: PageProps<'/admin/nustatymai'>) {
  const currentAdmin = await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const errorMessage =
    errorParam === 'invalid-id'
      ? 'Trūksta ID.'
      : errorParam === 'self-remove'
        ? 'Negalima pašalinti savęs iš administratorių sąrašo.'
        : errorParam === 'last-admin'
          ? 'Negalima pašalinti paskutinio administratoriaus — parduotuvė liktų be prieigos.'
          : errorParam === 'delete-failed'
            ? 'Nepavyko pašalinti administratoriaus.'
            : null

  // Paraleliai — nepriklausomi duomenys
  const [companyInfo, admins] = await Promise.all([
    getCompanyInfo(),
    getAdminUsers(),
  ])

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Antraštė */}
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Nustatymai</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Įmonės rekvizitai, banko duomenys ir administratorių valdymas.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* 1. Įmonės rekvizitai + banko duomenys */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="pb-4 border-b border-[#eee]">
          <h3 className="text-lg font-bold text-brand-gray-900">
            Įmonės rekvizitai
          </h3>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Šie duomenys rodomi el. laiškuose klientams, sąskaitose ir užsakymo
            patvirtinimo puslapyje. Banko duomenys naudojami pavedimo
            instrukcijoms.
          </p>
        </div>

        <CompanyInfoForm info={companyInfo} />
      </section>

      {/* 2. Administratoriai */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div className="pb-4 border-b border-[#eee]">
          <h3 className="text-lg font-bold text-brand-gray-900">
            Administratoriai
          </h3>
          <p className="mt-1 text-[13px] text-brand-gray-500">
            Vartotojai, turintys prieigą prie šios valdymo panelės. Pridedamas
            vartotojas privalo jau būti prisiregistravęs sistemoje.
          </p>
        </div>

        <AdminsManager admins={admins} currentAdminId={currentAdmin.id} />
      </section>
    </div>
  )
}
