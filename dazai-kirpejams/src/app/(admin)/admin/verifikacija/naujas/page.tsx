import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { createClientAction } from '../actions'

export const metadata = { title: 'Pridėti klientą' }
export const dynamic = 'force-dynamic'

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-email': 'Neteisingas el. pašto adresas.',
  'email-exists': 'Toks el. paštas jau registruotas. Patvirtinkite jį per vartotojų sąrašą.',
  'create-failed': 'Nepavyko sukurti vartotojo. Bandykite dar kartą.',
  'profile-failed': 'Nepavyko sukurti profilio. Bandykite dar kartą.',
}

export default async function NewClientPage({
  searchParams,
}: PageProps<'/admin/verifikacija/naujas'>) {
  await requireAdmin()
  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const errorMessage = errorParam
    ? (ERROR_MESSAGES[errorParam] ?? `Klaida: ${errorParam}`)
    : null

  const inputCls =
    'w-full px-4 py-2.5 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta'
  const labelCls = 'block text-[12px] font-semibold text-brand-gray-900 mb-1.5'

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/verifikacija"
          className="text-sm text-brand-gray-500 hover:text-brand-gray-900"
        >
          ← Verifikacija
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Pridėti klientą</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Sukuria iškart patvirtintą profesionalą — jis matys kainas ir gaus
          marketingo kampanijas. Skirta klientams, kuriuos pridedate patys, be
          savitarnos registracijos.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <form
        action={createClientAction}
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5"
      >
        <div>
          <label htmlFor="email" className={labelCls}>
            El. paštas <span className="text-red-500">*</span>
          </label>
          <input id="email" name="email" type="email" required placeholder="vardas@salonas.lt" className={inputCls} />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            Į šį adresą bus siunčiamos kampanijos (ir prisijungimo nuoroda, jei pažymėsite).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className={labelCls}>Vardas</label>
            <input id="first_name" name="first_name" type="text" placeholder="Vardas" className={inputCls} />
          </div>
          <div>
            <label htmlFor="last_name" className={labelCls}>Pavardė</label>
            <input id="last_name" name="last_name" type="text" placeholder="Pavardė" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="salon_name" className={labelCls}>Salono pavadinimas</label>
            <input id="salon_name" name="salon_name" type="text" placeholder="(nebūtina)" className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Telefonas</label>
            <input id="phone" name="phone" type="tel" placeholder="(nebūtina)" className={inputCls} />
          </div>
        </div>

        <div>
          <label htmlFor="business_type" className={labelCls}>Tipas</label>
          <select id="business_type" name="business_type" defaultValue="" className={inputCls}>
            <option value="">— Pasirinkite —</option>
            <option value="hairdresser">Kirpėjas / koloristas</option>
            <option value="salon">Salonas</option>
            <option value="other">Kita</option>
          </select>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input type="checkbox" name="send_invite" defaultChecked className="mt-0.5 accent-brand-magenta w-4 h-4" />
          <span className="text-sm text-brand-gray-900">
            Siųsti prisijungimo nuorodą el. paštu
            <span className="block text-[11px] text-brand-gray-500 font-normal mt-0.5">
              Klientas gaus laišką su nuoroda nusistatyti slaptažodį ir prisijungti.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta/90 transition-colors"
          >
            Sukurti klientą
          </button>
          <Link href="/admin/verifikacija" className="text-sm text-brand-gray-500 hover:text-brand-gray-900">
            Atšaukti
          </Link>
        </div>
      </form>
    </div>
  )
}
