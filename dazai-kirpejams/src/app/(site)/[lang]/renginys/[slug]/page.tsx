import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, eventSchema } from '@/lib/schema'
import { buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { formatEventDateLt, isEventPast } from '@/lib/events/config'
import { getActiveEventBySlug } from '@/lib/events/queries'
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm'

// 60 s revalidate — leidžia automatiškai uždaryti registracijos formą
// per valandą po renginio pabaigos, nereikalaujant manual revalidate.
export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/renginys/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(lang)) return {}

  const EVENT = await getActiveEventBySlug(slug)
  if (!EVENT) return {}

  const title = `${EVENT.title} ${EVENT.venueCity} | Registracija`
  const description = `${EVENT.description} Nemokamas įėjimas, būtina registracija. ${EVENT.venueName}, ${EVENT.venueCity}.`
  const canonical = buildCanonicalUrl(lang, `/renginys/${slug}`)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function EventDetailPage({
  params,
}: PageProps<'/[lang]/renginys/[slug]'>) {
  const { lang, slug } = await params
  if (!hasLocale(lang)) notFound()

  // EN/RU lankytojus nukreipiam į LT canonical URL'ą (renginiai LT kalba).
  if (lang !== 'lt') {
    redirect(`/renginys/${slug}`)
  }

  // Paslėptus (is_active=false) renginius public puslapis rodo kaip 404 —
  // admin'as juos toggle'ina per /admin/renginiai.
  const EVENT = await getActiveEventBySlug(slug)
  if (!EVENT) notFound()

  const past = isEventPast(EVENT)
  const dateStr = formatEventDateLt(EVENT)
  const eventUrl = `${SITE_URL}/renginys/${slug}`

  return (
    <>
      <JsonLd
        data={eventSchema({
          name: EVENT.title,
          description: EVENT.description,
          startsAtIso: EVENT.startsAtIso,
          endsAtIso: EVENT.endsAtIso,
          venueName: EVENT.venueName,
          venueStreet: EVENT.venueStreet,
          venueCity: EVENT.venueCity,
          venueCountry: EVENT.venueCountry,
          venuePostalCode: EVENT.venuePostalCode,
          url: eventUrl,
          isFree: EVENT.isFree,
          capacityMax: EVENT.capacityMax,
          organizerName: EVENT.presenterName,
          organizerEmail: EVENT.contactEmail,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Pradžia', url: buildCanonicalUrl('lt', '/') },
          { name: EVENT.shortTitle || EVENT.title, url: eventUrl },
        ])}
      />

      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/9] overflow-hidden">
        <Image
          src={EVENT.heroImageUrl ?? '/event-hero.jpg'}
          alt={`${EVENT.title} — ${EVENT.presenterName}`}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      <section className="bg-gradient-to-b from-[#FFF5FB] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
              {EVENT.isFree
                ? 'Nemokamas renginys · Būtina registracija'
                : 'Renginys · Būtina registracija'}
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-gray-900 leading-[1.1]">
              {EVENT.title}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-brand-gray-500 leading-relaxed">
              {EVENT.description}
            </p>
            {(EVENT.presenterName || EVENT.presenterTitle) && (
              <p className="mt-3 text-base text-brand-gray-500">
                Prezentuoja{' '}
                <strong className="text-brand-gray-900">
                  {EVENT.presenterName}
                </strong>
                {EVENT.presenterTitle ? `, ${EVENT.presenterTitle}` : ''}.
              </p>
            )}

            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <InfoCard label="Kada" value={dateStr} />
              <InfoCard
                label="Kur"
                value={`${EVENT.venueName}, ${EVENT.venueStreet}, ${EVENT.venueCity}`}
              />
              <InfoCard
                label="Įėjimas"
                value={EVENT.isFree ? 'Nemokamas' : 'Mokamas'}
                accent={EVENT.isFree}
              />
            </dl>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          <div className="lg:col-span-3 space-y-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-gray-900">
                Apie vietą
              </h2>
              <div className="mt-4 space-y-4 text-brand-gray-500 leading-relaxed">
                <p>
                  Renginys vyks{' '}
                  <strong className="text-brand-gray-900">
                    {EVENT.venueName}
                  </strong>
                  , adresu{' '}
                  <strong className="text-brand-gray-900">
                    {EVENT.venueStreet}, {EVENT.venueCity}
                  </strong>
                  . Atvykti rekomenduojame 10–15 min. anksčiau, kad galėtumėte
                  ramiai užsiregistruoti ir pasiruošti renginiui.
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${EVENT.venueStreet} ${EVENT.venueCity}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-brand-magenta font-semibold hover:underline"
              >
                Atidaryti žemėlapyje →
              </a>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-gray-900">
                Kam skirta
              </h2>
              <div className="mt-4 space-y-4 text-brand-gray-500 leading-relaxed">
                <p>
                  Šis renginys skirtas{' '}
                  <strong className="text-brand-gray-900">
                    kirpėjams, koloristams ir grožio salonų savininkams
                  </strong>
                  , kurie domisi profesionaliais plaukų dažais ir salono darbui
                  aktualiais sprendimais. Vietų skaičius ribotas — registracija
                  priimama iki vietų užpildymo.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 bg-white border border-[#eee] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              {past ? (
                <EventFinishedBlock />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-xs font-semibold text-brand-magenta uppercase tracking-wider">
                      Registracija
                    </div>
                    <h3 className="mt-2 text-2xl font-bold text-brand-gray-900">
                      Rezervuokite vietą
                    </h3>
                    <p className="mt-2 text-sm text-brand-gray-500">
                      Vietų skaičius — iki {EVENT.capacityMax}
                    </p>
                  </div>
                  <EventRegistrationForm eventSlug={EVENT.slug} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

    </>
  )
}

function InfoCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        accent
          ? 'bg-brand-magenta text-white border-transparent'
          : 'bg-white border-[#eee]'
      }`}
    >
      <dt
        className={`text-[11px] font-semibold uppercase tracking-wider ${
          accent ? 'text-white/70' : 'text-brand-gray-500'
        }`}
      >
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-semibold leading-snug ${
          accent ? 'text-white' : 'text-brand-gray-900'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function EventFinishedBlock() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-brand-gray-50 flex items-center justify-center mx-auto">
        <span className="text-2xl" aria-hidden="true">
          ✓
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-brand-gray-900">
        Renginys įvyko
      </h3>
      <p className="mt-2 text-sm text-brand-gray-500 leading-relaxed max-w-sm mx-auto">
        Dėkojame visiems, kurie dalyvavo. Sekite mūsų naujienas — netrukus
        paskelbsime sekantį renginį.
      </p>
      <a
        href="/lt/produktai"
        className="mt-6 inline-block px-6 py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:brightness-110 transition-colors"
      >
        Peržiūrėti Color SHOCK produktus
      </a>
    </div>
  )
}
