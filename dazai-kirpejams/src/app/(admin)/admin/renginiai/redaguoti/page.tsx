import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getActiveEvent,
  utcToVilniusInputValue,
} from '@/lib/events/queries'
import { updateEventAction } from '../actions'

export const metadata = {
  title: 'Redaguoti renginį',
}

export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  'invalid-slug': 'Trūksta renginio identifikatoriaus (slug).',
  'required-missing': 'Užpildykite visus privalomus laukus.',
  'invalid-email': 'Neteisingas el. pašto formatas.',
  'capacity-order': 'Maksimali talpa negali būti mažesnė už minimalią.',
  'date-order': 'Pabaigos laikas turi būti vėlesnis už pradžios.',
  'update-failed': 'Nepavyko išsaugoti. Bandykite dar kartą.',
}

export default async function EditEventPage({
  searchParams,
}: PageProps<'/admin/renginiai/redaguoti'>) {
  await requireAdmin()
  const event = await getActiveEvent()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : null
  const errorMessage = errorParam ? ERRORS[errorParam] ?? 'Nežinoma klaida.' : null

  const startsAtInput = utcToVilniusInputValue(event.startsAt)
  const endsAtInput = utcToVilniusInputValue(event.endsAt)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
            Visi laukai sinchronizuojami su viešu /renginys puslapiu, hero
            sekcija ir registracijos email'ais.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <form action={updateEventAction} className="space-y-6">
        <input type="hidden" name="slug" value={event.slug} />

        {/* Pagrindinė info */}
        <Section
          title="Pagrindinė informacija"
          desc="Pavadinimas, trumpas pavadinimas (admin sąrašui), aprašymas viešam puslapiui ir SEO meta."
        >
          <Field label="Pavadinimas" name="title" defaultValue={event.title} required />
          <Field
            label="Trumpas pavadinimas (admin UI)"
            name="short_title"
            defaultValue={event.shortTitle}
            required
          />
          <FieldTextarea
            label="Aprašymas"
            name="description"
            defaultValue={event.description}
            rows={4}
            required
            hint="2–3 sakiniai apie renginį. Naudojamas /renginys puslapyje, meta description, email'uose."
          />
        </Section>

        {/* Datos */}
        <Section
          title="Data ir laikas"
          desc="Vilniaus laiko juostos (EEST/EET) sieninis laikas. DB saugoma UTC, JSON-LD ir ICS gauna teisingą offset'ą automatiškai."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Pradžia"
              name="starts_at"
              type="datetime-local"
              defaultValue={startsAtInput}
              required
            />
            <Field
              label="Pabaiga"
              name="ends_at"
              type="datetime-local"
              defaultValue={endsAtInput}
              required
            />
          </div>
        </Section>

        {/* Vieta */}
        <Section title="Vieta" desc="Renginio adresas — naudojamas viešame puslapyje, JSON-LD schema ir kalendoriaus (ICS) faile.">
          <Field
            label="Vietos pavadinimas"
            name="venue_name"
            defaultValue={event.venueName}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-4">
            <Field
              label="Gatvė"
              name="venue_street"
              defaultValue={event.venueStreet}
              required
            />
            <Field
              label="Miestas"
              name="venue_city"
              defaultValue={event.venueCity}
              required
            />
            <Field
              label="Pašto kodas (nebūtina)"
              name="venue_postal_code"
              defaultValue={event.venuePostalCode ?? ''}
            />
          </div>
          <Field
            label="Šalis (2 raidžių kodas)"
            name="venue_country"
            defaultValue={event.venueCountry}
            maxLength={2}
            required
          />
        </Section>

        {/* Pranešėjas */}
        <Section title="Pranešėjas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Vardas, pavardė"
              name="presenter_name"
              defaultValue={event.presenterName}
              required
            />
            <Field
              label="Pareigos / titulas"
              name="presenter_title"
              defaultValue={event.presenterTitle}
              required
            />
          </div>
        </Section>

        {/* Talpa */}
        <Section
          title="Talpa ir registracija"
          desc={'Min/max dalyvių skaičius. Capacity bar ir „lieka X vietų" pranešimai naudoja max ribą.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Min. dalyvių"
              name="capacity_min"
              type="number"
              defaultValue={String(event.capacityMin)}
              min={0}
              required
            />
            <Field
              label="Maks. dalyvių"
              name="capacity_max"
              type="number"
              defaultValue={String(event.capacityMax)}
              min={1}
              required
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-brand-gray-900">
                Nemokamas
              </span>
              <label className="inline-flex items-center gap-2 text-sm text-brand-gray-900 mt-1">
                <input
                  type="checkbox"
                  name="is_free"
                  defaultChecked={event.isFree}
                  className="w-4 h-4 accent-brand-magenta"
                />
                Įėjimas nemokamas
              </label>
            </div>
          </div>
        </Section>

        {/* Kontaktas */}
        <Section title="Kontaktas">
          <Field
            label="Organizatoriaus el. paštas"
            name="contact_email"
            type="email"
            defaultValue={event.contactEmail}
            required
            hint="Naudojamas JSON-LD organizatoriaus laukui ir registracijos email'uose."
          />
        </Section>

        {/* Routing */}
        <Section title="Maršrutas" desc="Santykinis URL kelias public puslapiui. Keiskite tik jei tikrai žinote, ką darote — pakeičia ir sitemap'ą.">
          <Field
            label="Public path"
            name="path"
            defaultValue={event.path}
            required
          />
        </Section>

        {/* Veiksmai */}
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

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-4">
      <header>
        <h3 className="text-base font-bold text-brand-gray-900">{title}</h3>
        {desc && <p className="mt-1 text-[12px] text-brand-gray-500">{desc}</p>}
      </header>
      {children}
    </section>
  )
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  maxLength,
  min,
  hint,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  maxLength?: number
  min?: number
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-brand-gray-900">
        {label} {required && <span className="text-brand-magenta">*</span>}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        min={min}
        className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm text-brand-gray-900 focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
      />
      {hint && <span className="text-[11px] text-brand-gray-500">{hint}</span>}
    </label>
  )
}

function FieldTextarea({
  label,
  name,
  defaultValue,
  rows = 3,
  required,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  rows?: number
  required?: boolean
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-brand-gray-900">
        {label} {required && <span className="text-brand-magenta">*</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        required={required}
        className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm text-brand-gray-900 focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all resize-y"
      />
      {hint && <span className="text-[11px] text-brand-gray-500">{hint}</span>}
    </label>
  )
}
