/**
 * Bendri form'os laukai naujam ir redagavimo puslapiui. Server component.
 * Slug'as ir kontrolinis "is_active" pasiekiami tik admin sąraše per atskirą
 * `setEventActiveAction` — formos neapima šių laukų, kad išvengtume klaidų.
 */

type Defaults = {
  title?: string
  shortTitle?: string
  description?: string
  startsAtInput?: string
  endsAtInput?: string
  venueName?: string
  venueStreet?: string
  venueCity?: string
  venuePostalCode?: string
  venueCountry?: string
  presenterName?: string
  presenterTitle?: string
  isFree?: boolean
  capacityMin?: number
  capacityMax?: number
  contactEmail?: string
}

export function EventFormFields({ defaults = {} }: { defaults?: Defaults }) {
  return (
    <>
      <Section
        title="Pagrindinė informacija"
        desc="Pavadinimas, trumpas pavadinimas (admin sąrašui), aprašymas viešam puslapiui ir SEO meta."
      >
        <Field
          label="Pavadinimas"
          name="title"
          defaultValue={defaults.title ?? ''}
          required
        />
        <Field
          label="Trumpas pavadinimas (admin UI)"
          name="short_title"
          defaultValue={defaults.shortTitle ?? ''}
          required
        />
        <FieldTextarea
          label="Aprašymas"
          name="description"
          defaultValue={defaults.description ?? ''}
          rows={4}
          required
          hint="2–3 sakiniai apie renginį. Naudojamas /renginys/<slug> puslapyje, meta description, email'uose."
        />
      </Section>

      <Section
        title="Data ir laikas"
        desc="Vilniaus laiko juostos (EEST/EET) sieninis laikas. DB saugoma UTC, JSON-LD ir ICS gauna teisingą offset'ą automatiškai."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Pradžia"
            name="starts_at"
            type="datetime-local"
            defaultValue={defaults.startsAtInput ?? ''}
            required
          />
          <Field
            label="Pabaiga"
            name="ends_at"
            type="datetime-local"
            defaultValue={defaults.endsAtInput ?? ''}
            required
          />
        </div>
      </Section>

      <Section
        title="Vieta"
        desc="Renginio adresas — naudojamas viešame puslapyje, JSON-LD schema ir kalendoriaus (ICS) faile."
      >
        <Field
          label="Vietos pavadinimas"
          name="venue_name"
          defaultValue={defaults.venueName ?? ''}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-4">
          <Field
            label="Gatvė"
            name="venue_street"
            defaultValue={defaults.venueStreet ?? ''}
            required
          />
          <Field
            label="Miestas"
            name="venue_city"
            defaultValue={defaults.venueCity ?? ''}
            required
          />
          <Field
            label="Pašto kodas (nebūtina)"
            name="venue_postal_code"
            defaultValue={defaults.venuePostalCode ?? ''}
          />
        </div>
        <Field
          label="Šalis (2 raidžių kodas)"
          name="venue_country"
          defaultValue={defaults.venueCountry ?? 'LT'}
          maxLength={2}
          required
        />
      </Section>

      <Section title="Pranešėjas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Vardas, pavardė"
            name="presenter_name"
            defaultValue={defaults.presenterName ?? ''}
            required
          />
          <Field
            label="Pareigos / titulas"
            name="presenter_title"
            defaultValue={defaults.presenterTitle ?? ''}
            required
          />
        </div>
      </Section>

      <Section
        title="Talpa ir registracija"
        desc={'Min/max dalyvių skaičius. Capacity bar ir „lieka X vietų" pranešimai naudoja max ribą.'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Min. dalyvių"
            name="capacity_min"
            type="number"
            defaultValue={String(defaults.capacityMin ?? 0)}
            min={0}
            required
          />
          <Field
            label="Maks. dalyvių"
            name="capacity_max"
            type="number"
            defaultValue={String(defaults.capacityMax ?? 50)}
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
                defaultChecked={defaults.isFree ?? true}
                className="w-4 h-4 accent-brand-magenta"
              />
              Įėjimas nemokamas
            </label>
          </div>
        </div>
      </Section>

      <Section title="Kontaktas">
        <Field
          label="Organizatoriaus el. paštas"
          name="contact_email"
          type="email"
          defaultValue={defaults.contactEmail ?? ''}
          required
          hint="Naudojamas JSON-LD organizatoriaus laukui ir registracijos email'uose."
        />
      </Section>
    </>
  )
}

export function Section({
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

export function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  maxLength,
  min,
  hint,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  maxLength?: number
  min?: number
  hint?: string
  placeholder?: string
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
        placeholder={placeholder}
        className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm text-brand-gray-900 focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
      />
      {hint && <span className="text-[11px] text-brand-gray-500">{hint}</span>}
    </label>
  )
}

export function FieldTextarea({
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

export const FORM_ERRORS: Record<string, string> = {
  'invalid-slug': 'Trūksta renginio identifikatoriaus (slug).',
  'slug-taken': 'Toks renginio ID (slug) jau egzistuoja. Pasirinkite kitą.',
  'required-missing': 'Užpildykite visus privalomus laukus.',
  'invalid-email': 'Neteisingas el. pašto formatas.',
  'capacity-order': 'Maksimali talpa negali būti mažesnė už minimalią.',
  'date-order': 'Pabaigos laikas turi būti vėlesnis už pradžios.',
  'update-failed': 'Nepavyko išsaugoti. Bandykite dar kartą.',
  'image-missing': 'Pasirinkite paveikslėlio failą.',
  'image-too-large': 'Failas per didelis — maksimalus dydis 10 MB.',
  'image-format': 'Netinkamas formatas. Leidžiama: JPG, PNG, WebP, AVIF.',
  'image-upload-failed': 'Nepavyko įkelti paveikslėlio į saugyklą.',
}

export const FORM_SAVED: Record<string, string> = {
  event: 'Renginio duomenys išsaugoti.',
  created: 'Naujas renginys sukurtas. Jis yra paslėptas — įjunkite jį renginių sąraše, kad atsirastų viešai.',
  'created-with-image':
    'Naujas renginys sukurtas su hero nuotrauka. Jis yra paslėptas — įjunkite jį renginių sąraše, kad atsirastų viešai.',
  'created-image-failed':
    'Renginys sukurtas, bet hero nuotraukos įkelti nepavyko. Bandykite įkelti dar kartą čia, redagavimo formoje.',
  image: 'Hero nuotrauka įkelta.',
  'image-removed':
    'Hero nuotrauka pašalinta — viešas puslapis grįžo prie numatytojo /event-hero.jpg.',
}
