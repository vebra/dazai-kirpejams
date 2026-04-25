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
            <div className="space-y-4 text-brand-gray-500 leading-relaxed">
              <p>
                Kviečiame į gyvą profesionalių{' '}
                <strong className="text-brand-gray-900">
                  Color SHOCK plaukų dažų
                </strong>{' '}
                prezentaciją Kaune, kurios metu vyks praktinė dažymo technikų
                demonstracija su{' '}
                <strong className="text-brand-gray-900">gyvu modeliu</strong>.
              </p>
              <p>
                Renginio metu pamatysite realų dažymo procesą nuo pradžios iki
                galutinio rezultato: spalvos parinkimą, dažų mišinio paruošimą,
                aplikavimo eigą, darbo su oksidantais principus ir rezultato
                įvertinimą.
              </p>
              <p>
                Prezentaciją ves{' '}
                <strong className="text-brand-gray-900">
                  {EVENT.presenterName}
                </strong>{' '}
                –{' '}
                <strong className="text-brand-gray-900">
                  Color SHOCK technologė-atstovė
                </strong>
                , ilgametę patirtį turinti plaukų stilistė, įvaizdžio kūrėja ir
                profesionalių mokymų lektorė.
              </p>
              <p>
                Tai puiki galimybė kirpėjams, koloristams ir grožio salonų
                savininkams iš arti susipažinti su{' '}
                <strong className="text-brand-gray-900">
                  Color SHOCK dažais
                </strong>
                , pamatyti jų veikimą realioje situacijoje ir užduoti rūpimus
                klausimus apie produktų naudojimą kasdienėje salono praktikoje.
              </p>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-gray-900">
                Ko tikėtis
              </h2>
              <ul className="mt-6 space-y-4">
                <FeatureItem
                  title="Gyva demonstracija su gyvu modeliu"
                  desc="Pamatysite realų dažymo procesą su Color SHOCK profesionaliais plaukų dažais — nuo konsultacijos ir spalvos parinkimo iki mišinio paruošimo, aplikavimo bei galutinio rezultato įvertinimo."
                />
                <FeatureItem
                  title="Dažymo technikos profesionalams"
                  desc="Džiuljeta Vėbrė praktiškai parodys dažymo technikas, kurios aktualios kasdieniam darbui salone: žilų plaukų dengimą, spalvos atnaujinimą, tonų korekciją ir profesionalų dažų pritaikymą pagal kliento poreikį."
                />
                <FeatureItem
                  title="Color SHOCK produktų pristatymas"
                  desc="Bus pristatyti Color SHOCK profesionalūs plaukų dažai ir jų naudojimo principai. Sužinosite, kaip pasirinkti tinkamą atspalvį, kaip teisingai maišyti produktus ir kaip pasiekti stabilų, prognozuojamą rezultatą."
                />
                <FeatureItem
                  title="Oksidantų variantai ir jų paskirtis"
                  desc="Aptarsime skirtingus oksiduojančių emulsijų stiprumus — 1,5 %, 3 %, 6 % ir 9 % — bei jų praktinį naudojimą salono darbe. Paaiškinsime, kada rinktis švelnesnį, o kada stipresnį oksidantą."
                />
                <FeatureItem
                  title="180 ml pakuotės nauda salonui"
                  desc="Ypatingas dėmesys 180 ml Color SHOCK dažų pakuotei: kodėl didesnė tūbelė yra ekonomiškas sprendimas — mažesnė vieno dažymo savikaina, patogesnis atsargų planavimas, mažiau užsakymų ir daugiau produkto profesionaliam darbui."
                />
                <FeatureItem
                  title="Klausimų ir atsakymų sesija"
                  desc="Turėsite galimybę užduoti klausimus apie spalvų parinkimą, dažų maišymą, oksidantų pasirinkimą, sąnaudas, žilų plaukų dengimą ir Color SHOCK produktų taikymą kasdienėje praktikoje."
                />
                <FeatureItem
                  title="Kava ir lengvos vaišės"
                  desc="Dalyvių lauks kava ir lengvos vaišės — proga ne tik pamatyti demonstraciją, bet ir pabendrauti, aptarti rūpimus klausimus bei susipažinti su Color SHOCK dažų naudojimo galimybėmis."
                />
              </ul>
            </div>

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
                  . Salone bus sėdimos ir stovimos vietos, gera matomumo zona
                  prie gyvo modelio vietos — dalyviai galės patogiai stebėti
                  dažymo procesą, matyti naudojamus produktus ir užduoti
                  klausimus demonstracijos metu.
                </p>
                <p>
                  Atvykti rekomenduojame{' '}
                  <strong className="text-brand-gray-900">
                    10–15 min. anksčiau
                  </strong>
                  , kad galėtumėte ramiai užsiregistruoti, susipažinti su
                  renginio eiga ir pasiruošti prezentacijai.
                </p>
              </div>
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
              <div className="mt-4 space-y-4 text-brand-gray-500 leading-relaxed">
                <p>
                  Šis renginys skirtas{' '}
                  <strong className="text-brand-gray-900">
                    kirpėjams, koloristams ir grožio salonų savininkams
                  </strong>
                  , kurie nori susipažinti su Color SHOCK profesionaliais
                  plaukų dažais, pamatyti jų veikimą realioje situacijoje ir
                  įvertinti, kaip šie produktai gali būti pritaikomi kasdieniam
                  darbui salone.
                </p>
                <p>
                  Prezentacija ypač aktuali tiems, kurie ieško profesionalių,
                  ekonomiškų ir patikimų dažymo sprendimų, nori geriau suprasti
                  oksidantų naudojimą, spalvų parinkimą ir{' '}
                  <strong className="text-brand-gray-900">
                    180 ml pakuotės naudą
                  </strong>{' '}
                  salono darbui. Vietų skaičius ribotas — registracija priimama
                  iki vietų užpildymo.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-gray-900">
                Kodėl verta dalyvauti
              </h2>
              <div className="mt-4 space-y-4 text-brand-gray-500 leading-relaxed">
                <p>
                  Dalyvaudami prezentacijoje gausite ne teorinį produkto
                  aprašymą, o gyvą ir praktišką patirtį. Matysite, kaip{' '}
                  <strong className="text-brand-gray-900">
                    Color SHOCK dažai
                  </strong>{' '}
                  veikia realiame dažymo procese su gyvu modeliu — galėsite
                  įvertinti produkto tekstūrą, maišymą, aplikavimą ir
                  rezultatą.
                </p>
                <p>
                  Tai galimybė iš arti susipažinti su profesionalia dažų
                  linija, sukurta kasdieniam salono darbui, ir praktiškai
                  įvertinti, kaip{' '}
                  <strong className="text-brand-gray-900">
                    180 ml dažų tūbelė
                  </strong>{' '}
                  gali padėti dirbti ekonomiškiau bei efektyviau.
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
