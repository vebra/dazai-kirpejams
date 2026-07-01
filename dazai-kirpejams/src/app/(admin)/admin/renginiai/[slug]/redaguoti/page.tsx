import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getEventBySlug,
  utcToVilniusInputValue,
} from '@/lib/events/queries'
import {
  removeEventHeroImageAction,
  updateEventAction,
  uploadEventHeroImageAction,
} from '../../actions'
import {
  EventFormFields,
  FORM_ERRORS,
  FORM_SAVED,
} from '../../EventFormFields'

export const metadata = {
  title: 'Redaguoti renginį',
}

export const dynamic = 'force-dynamic'

export default async function EditEventPage({
  params,
  searchParams,
}: PageProps<'/admin/renginiai/[slug]/redaguoti'>) {
  await requireAdmin()
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : null
  const savedParam = typeof sp.saved === 'string' ? sp.saved : null
  const errorMessage = errorParam ? FORM_ERRORS[errorParam] ?? 'Nežinoma klaida.' : null
  const savedMessage = savedParam ? FORM_SAVED[savedParam] ?? null : null

  const startsAtInput = utcToVilniusInputValue(event.startsAt)
  const endsAtInput = utcToVilniusInputValue(event.endsAt)
  const heroDisplayUrl = event.heroImageUrl ?? '/event-hero.jpg'

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
          Redaguoti renginį
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          <span className="font-mono text-[11px] bg-brand-gray-50 px-1.5 py-0.5 rounded border border-[#eee]">
            {event.slug}
          </span>{' '}
          · {event.title}
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      {savedMessage && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {savedMessage}
        </div>
      )}

      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-4">
        <header>
          <h3 className="text-base font-bold text-brand-gray-900">
            Hero nuotrauka
          </h3>
          <p className="mt-1 text-[12px] text-brand-gray-500">
            Rodoma per visą plotį /renginys/{event.slug} puslapio viršuje.
            Rekomendacija: 16:9 ar 21:9, bent 1600×900 px. Iki 10 MB.
          </p>
        </header>

        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-lg overflow-hidden bg-brand-gray-50 border border-[#E0E0E0]">
          <Image
            src={heroDisplayUrl}
            alt="Renginio hero nuotrauka"
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover"
          />
          {!event.heroImageUrl && (
            <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[11px] py-1.5 px-3 text-center">
              Numatytasis (/event-hero.jpg) — admin&apos;as dar neįkėlė savojo
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
          <form
            action={uploadEventHeroImageAction}
            encType="multipart/form-data"
            className="flex-1 min-w-[260px] flex flex-col gap-2"
          >
            <input type="hidden" name="slug" value={event.slug} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-brand-gray-900">
                Pasirinkti naują nuotrauką
              </span>
              <input
                type="file"
                name="hero_image"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
                className="text-sm text-brand-gray-900 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-magenta file:text-white file:text-[12px] file:font-semibold file:cursor-pointer hover:file:bg-brand-magenta-dark"
              />
            </label>
            <button
              type="submit"
              className="self-start inline-flex items-center gap-2 px-4 py-2 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[12px] font-semibold transition-colors"
            >
              Įkelti nuotrauką
            </button>
          </form>

          {event.heroImageUrl && (
            <form action={removeEventHeroImageAction}>
              <input type="hidden" name="slug" value={event.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-[12px] font-semibold transition-colors"
              >
                Pašalinti nuotrauką
              </button>
            </form>
          )}
        </div>
      </section>

      <form action={updateEventAction} className="space-y-6">
        <input type="hidden" name="slug" value={event.slug} />

        <EventFormFields
          defaults={{
            title: event.title,
            shortTitle: event.shortTitle,
            description: event.description,
            startsAtInput,
            endsAtInput,
            venueName: event.venueName,
            venueStreet: event.venueStreet,
            venueCity: event.venueCity,
            venuePostalCode: event.venuePostalCode ?? '',
            venueCountry: event.venueCountry,
            presenterName: event.presenterName,
            presenterTitle: event.presenterTitle,
            isFree: event.isFree,
            capacityMin: event.capacityMin,
            capacityMax: event.capacityMax,
            contactEmail: event.contactEmail,
          }}
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            Išsaugoti pakeitimus
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
