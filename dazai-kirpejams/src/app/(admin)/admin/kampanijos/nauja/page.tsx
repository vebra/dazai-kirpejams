import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { createCampaignAction } from '../actions'
import { CampaignImagePicker } from '../CampaignImagePicker'

export const metadata = { title: 'Nauja kampanija' }
export const dynamic = 'force-dynamic'

export default async function NewCampaignPage({
  searchParams,
}: PageProps<'/admin/kampanijos/nauja'>) {
  await requireAdmin()
  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/kampanijos"
          className="text-sm text-brand-gray-500 hover:text-brand-gray-900"
        >
          ← Kampanijos
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Nauja kampanija</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Pirma sukurkite juodraštį, paskui galėsite atsiųsti testą sau ir tik
          tada visiems patvirtintiems vartotojams.
        </p>
      </div>

      {errorParam && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorParam === 'missing-fields'
            ? 'Visi laukai privalomi.'
            : `Klaida: ${errorParam}`}
        </div>
      )}

      <form action={createCampaignAction} className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
            Vidinis pavadinimas <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="pvz. „Ar žinote kas mes esame — 2026-05"
            className="w-full px-4 py-2.5 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            Matomas tik jums admin&apos;o sąraše. Klientai šio nemato.
          </p>
        </div>

        <div>
          <label htmlFor="subject" className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
            El. laiško tema <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            placeholder="pvz. Ar žinote kas mes esame?"
            className="w-full px-4 py-2.5 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
          />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            Klientas mato tai pirmą — laikykit trumpa ir aiškią.
          </p>
        </div>

        <div>
          <label htmlFor="body" className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
            Tekstas <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={10}
            placeholder={`Pavyzdžiui:

Esame Dažai Kirpėjams — Color SHOCK gamintojo atstovai Lietuvoje. Mūsų dažai ateina 180 ml pakuotėje (vietoj įprasto 60 ml), todėl vienai galvai pakanka mažiau pakuočių.

Kviečiame susipažinti su mūsų katalogu...`}
            className="w-full px-4 py-3 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta font-mono leading-relaxed"
          />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            Paprastas tekstas. Atskiri paragrafai — dvi naujos eilutės (Enter du
            kartus). Nuorodos su https:// automatiškai taps spaudžiamais link&apos;ais.
          </p>
        </div>

        <CampaignImagePicker />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta/90 transition-colors"
          >
            Sukurti juodraštį
          </button>
          <Link
            href="/admin/kampanijos"
            className="text-sm text-brand-gray-500 hover:text-brand-gray-900"
          >
            Atšaukti
          </Link>
        </div>
      </form>
    </div>
  )
}
