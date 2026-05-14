import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { createEventAction } from '../actions'
import {
  EventFormFields,
  FORM_ERRORS,
  Field,
  Section,
} from '../EventFormFields'

export const metadata = {
  title: 'Naujas renginys',
}

export const dynamic = 'force-dynamic'

export default async function NewEventPage({
  searchParams,
}: PageProps<'/admin/renginiai/naujas'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : null
  const errorMessage = errorParam ? FORM_ERRORS[errorParam] ?? 'Nežinoma klaida.' : null

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/renginiai"
          className="inline-flex items-center text-[12px] text-brand-gray-500 hover:text-brand-magenta transition-colors mb-2"
        >
          ← Grįžti į renginių sąrašą
        </Link>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Naujas renginys
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Sukurtas renginys pradeda <strong>paslėptas</strong> — viešai
          neatsiras, kol neįjungsite jo renginių sąraše. Hero nuotrauką
          galėsite įkelti po sukūrimo.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <form
        action={createEventAction}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <Section
          title="Renginio ID (slug)"
          desc="URL kelio dalis: /renginys/<slug>. Leidžiama palikti tuščią — tada
          sugeneruojama automatiškai iš pavadinimo. Maks. 80 simbolių, mažosios
          raidės, skaičiai ir brūkšneliai."
        >
          <Field
            label="Slug (nebūtina)"
            name="slug"
            placeholder="pvz. vasaros-prezentacija-2026"
            hint="Jei nesate tikri — palikite tuščią, sugeneruos iš pavadinimo."
          />
        </Section>

        <Section
          title="Hero nuotrauka (nebūtina)"
          desc="Rodoma per visą plotį /renginys/<slug> puslapio viršuje. Rekomendacija: 16:9 ar 21:9, bent 1600×900 px. JPG/PNG/WebP/AVIF iki 10 MB. Jei nepasirinksite — bus naudojama numatytoji /event-hero.jpg."
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-brand-gray-900">
              Pasirinkti nuotrauką
            </span>
            <input
              type="file"
              name="hero_image"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="text-sm text-brand-gray-900 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-magenta file:text-white file:text-[12px] file:font-semibold file:cursor-pointer hover:file:bg-brand-magenta-dark"
            />
            <span className="text-[11px] text-brand-gray-500">
              Vėliau visada galėsite pakeisti per redagavimo puslapį.
            </span>
          </label>
        </Section>

        <EventFormFields />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            Sukurti renginį
          </button>
          <Link
            href="/admin/renginiai"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[13px] font-semibold transition-colors"
          >
            Atšaukti
          </Link>
        </div>
      </form>
    </div>
  )
}
