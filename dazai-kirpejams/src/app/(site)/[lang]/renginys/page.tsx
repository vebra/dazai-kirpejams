import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, eventSchema } from '@/lib/schema'
import { buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import {
  DAZU_PREZENTACIJA_2026,
  formatEventDateLt,
  isEventPast,
} from '@/lib/events/config'
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm'

// 60 s revalidate — data yra (beveik) statinis turinys, bet „renginys įvyko"
// būsena turi persijungti automatiškai po endsAt. 60s užtikrina, kad
// per valandą po renginio formos jau nebebus.
export const revalidate = 60

const EVENT = DAZU_PREZENTACIJA_2026

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/renginys'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const title = `${EVENT.title} — 2026 05 17 Kaune | Registracija`
  const description = `${EVENT.description} Nemokamas įėjimas, būtina registracija. ${EVENT.venueName}, Kaunas.`
  const canonical = buildCanonicalUrl(lang, '/renginys')

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function EventPage({
  params,
}: PageProps<'/[lang]/renginys'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  // Renginys vyksta Kaune LT kalba — EN/RU lankytojus nukreipiam į LT
  // versiją, kad neturėtume prastai išverstų placeholder'ių.
  if (lang !== 'lt') {
    redirect('/lt/renginys')
  }

  const past = isEventPast(EVENT)
  const dateStr = formatEventDateLt(EVENT)
  const eventUrl = `${SITE_URL}${EVENT.path}`

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
          { name: 'Renginys', url: eventUrl },
        ])}
      />

      <section className="bg-gradient-to-b from-[#FFF5FB] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
              Nemokamas renginys · Būtina registracija
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-gray-900 leading-[1.1]">
              Color SHOCK dažų{' '}
              <span className="text-brand-magenta">prezentacija</span> Kaune
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-brand-gray-500 leading-relaxed">
              Gyvas Color SHOCK dažų pristatymas su dažymo technikų demonstracija
              ant modelio. Prezentuoja{' '}
              <strong className="text-brand-gray-900">
                {EVENT.presenterName}
              </strong>
              , {EVENT.presenterTitle}.
            </p>

            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <InfoCard label="Kada" value={dateStr} />
              <InfoCard
                label="Kur"
                value={`${EVENT.venueName}, ${EVENT.venueStreet}, ${EVENT.venueCity}`}
              />
              <InfoCard label="Įėjimas" value="Nemokamas" accent />
            </dl>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          <div className="lg:col-span-3 space-y-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-gray-900">
                Ko tikėtis
              </h2>
              <ul className="mt-6 space-y-4">
                <FeatureItem
                  title="Live demo ant modelio"
                  desc="Pamatysite realų dažymo procesą su Color SHOCK produktais — spalvų maišymą, aplikavimą, rezultato vertinimą."
                />
                <FeatureItem
                  title="Dažymo technikos profesionalams"
                  desc="Džiuljeta Vėbrė parodys technikas, kurios kasdien naudojamos salone — nuo žilų dengimo iki šviesinimo 2–3 tonais."
                />
                <FeatureItem
                  title="Produktų demonstracija"
                  desc="Kiekvienas oksidantų variantas (1.5%, 3%, 6%, 9%) ir jo paskirtis — praktiškai, o ne iš lentelės."
                />
                <FeatureItem
                  title="Q&A sesija"
                  desc="Klauskite visko, kas aktualu kasdieniam darbui salone — spalvų parinkimas, sąnaudos, 180 ml talpos nauda."
                />
                <FeatureItem
                  title="Vaišės ir dovanos"
                  desc="Lengvas užkandis ir kava dalyviams. Kiekvienas dalyvis išsineš ir dovaną."
                />
              </ul>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-gray-900">
                Apie vietą
              </h2>
              <p className="mt-4 text-brand-gray-500 leading-relaxed">
                Renginys vyks{' '}
                <strong className="text-brand-gray-900">
                  {EVENT.venueName}
                </strong>{' '}
                — {EVENT.venueStreet}, {EVENT.venueCity}. Salone bus sėdimos ir
                stovimos vietos, gera matomumo zona prie modelio vietos. Ateiti
                patartina 10–15 min. anksčiau.
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Kipro+Petrausko+g.+44+Kaunas"
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
              <p className="mt-4 text-brand-gray-500 leading-relaxed">
                Kirpėjams, koloristams ir grožio salonų savininkams, kurie nori
                pamatyti Color SHOCK produktus veikme ir aptarti jų taikymą
                savo kasdieniam darbui. Vietų skaičius ribotas — registracijos
                priimamos iki užpildymo.
              </p>
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
                  <EventRegistrationForm />
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

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-magenta/10 text-brand-magenta flex items-center justify-center font-bold">
        ✓
      </div>
      <div>
        <h3 className="font-semibold text-brand-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-brand-gray-500 leading-relaxed">
          {desc}
        </p>
      </div>
    </li>
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
        className="mt-6 inline-block px-6 py-3 bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark transition-colors"
      >
        Peržiūrėti Color SHOCK produktus
      </a>
    </div>
  )
}
