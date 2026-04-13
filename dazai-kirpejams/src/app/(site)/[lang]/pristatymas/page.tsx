import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata } from '@/lib/seo'
import { CONTACT, phoneHref } from '@/lib/site'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pristatymas'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/pristatymas',
    title: 'Pristatymas ir grąžinimas',
    description:
      'Pristatymo būdai, kainos ir terminai. Grąžinimo politika per 14 dienų pagal LR teisės aktus. Nemokamas pristatymas nuo €50.',
  })
}

export default async function DeliveryPage({
  params,
}: PageProps<'/[lang]/pristatymas'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            Pradžia
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            Pristatymas ir grąžinimas
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Informacija
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2] max-w-[820px] mx-auto">
            Pristatymas ir{' '}
            <span className="text-brand-magenta">grąžinimas</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[680px] mx-auto">
            Sužinokite apie pristatymo būdus, terminus ir grąžinimo sąlygas.
            Mūsų tikslas — greitas ir patogus aptarnavimas.
          </p>
        </Container>
      </section>

      {/* Shipping methods */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Pristatymas
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Pristatymo būdai
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Pasirinkite Jums patogiausią pristatymo būdą
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: '🚚',
                title: 'Kurjeris',
                desc: 'Prekės pristatomos tiesiai iki Jūsų durų visoje Lietuvoje darbo dienomis.',
                time: '1–3 darbo dienos',
              },
              {
                icon: '📦',
                title: 'Paštomatas',
                desc: 'Atsiimkite siuntą Jums artimiausiame LP EXPRESS arba Omniva paštomatų tinkle.',
                time: '1–2 darbo dienos',
              },
              {
                icon: '🏢',
                title: 'Atsiėmimas Kaune',
                desc: 'Atsiimkite užsakymą mūsų sandėlyje Kaune nemokamai, sutartu laiku.',
                time: 'Tą pačią / kitą dieną',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-brand-gray-50 rounded-xl p-8 text-center border border-transparent hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] flex items-center justify-center text-[2rem] mb-5">
                  <span aria-hidden>{card.icon}</span>
                </div>
                <h4 className="text-[1.15rem] font-bold text-brand-gray-900 mb-2.5">
                  {card.title}
                </h4>
                <p className="text-[0.92rem] text-brand-gray-500 leading-[1.6] mb-4">
                  {card.desc}
                </p>
                <span className="inline-block px-4 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-[0.82rem] font-semibold">
                  {card.time}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing table */}
          <div className="bg-brand-gray-50 rounded-xl p-8 lg:p-10 border border-[#E0E0E0] max-w-[920px] mx-auto">
            <h3 className="text-[1.35rem] font-bold text-brand-gray-900 mb-6 text-center">
              Pristatymo kainos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[0.95rem]">
                <thead>
                  <tr className="border-b-2 border-[#E0E0E0]">
                    <th className="text-left py-3 pr-4 font-bold text-brand-gray-900">
                      Pristatymo būdas
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-brand-gray-900">
                      Terminas
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-brand-gray-900">
                      Kaina
                    </th>
                    <th className="text-left py-3 pl-4 font-bold text-brand-gray-900">
                      Nuo €50
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      method: '🚚 Kurjeris (visoje Lietuvoje)',
                      term: '1–3 d.d.',
                      price: '€3,99',
                      free: true,
                    },
                    {
                      method: '📦 LP EXPRESS paštomatas',
                      term: '1–2 d.d.',
                      price: '€2,49',
                      free: true,
                    },
                    {
                      method: '📦 Omniva paštomatas',
                      term: '1–2 d.d.',
                      price: '€2,49',
                      free: true,
                    },
                    {
                      method: '🏢 Atsiėmimas Kaune',
                      term: 'Tą pačią / kitą dieną',
                      price: 'Nemokamas',
                      free: true,
                      priceIsFree: true,
                    },
                  ].map((row) => (
                    <tr
                      key={row.method}
                      className="border-b border-[#E0E0E0] last:border-b-0"
                    >
                      <td className="py-4 pr-4 text-brand-gray-900">
                        {row.method}
                      </td>
                      <td className="py-4 px-4 text-brand-gray-500">
                        {row.term}
                      </td>
                      <td
                        className={`py-4 px-4 ${
                          row.priceIsFree
                            ? 'text-brand-magenta font-bold'
                            : 'text-brand-gray-900'
                        }`}
                      >
                        {row.price}
                      </td>
                      <td className="py-4 pl-4">
                        {row.free && (
                          <strong className="text-brand-magenta">
                            Nemokamas
                          </strong>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-[0.9rem] text-brand-gray-500 text-center">
              🌍 <strong>Pristatymo teritorija:</strong> šiuo metu pristatome
              tik Lietuvos Respublikos teritorijoje.
            </p>
          </div>

          {/* Free shipping banner */}
          <div className="mt-10 bg-brand-magenta rounded-xl p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-6 text-white max-w-[920px] mx-auto">
            <div className="text-[3rem] flex-shrink-0" aria-hidden>
              🎁
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-[1.2rem] font-bold mb-1.5">
                Nemokamas pristatymas nuo €50
              </h4>
              <p className="text-[0.95rem] text-white/90 leading-[1.6]">
                Užsakymams nuo 50 € pristatymas visoje Lietuvoje yra visiškai
                nemokamas — nepriklausomai nuo pasirinkto pristatymo būdo.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Returns section */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Grąžinimas
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Grąžinimo sąlygos
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Jūsų pasitenkinimas mums svarbus. Susipažinkite su grąžinimo
              tvarka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '📅',
                title: 'Grąžinimas per 14 dienų',
                desc: 'Turite teisę grąžinti prekę per 14 kalendorinių dienų nuo gavimo dienos, nenurodydami priežasties.',
              },
              {
                icon: '📦',
                title: 'Originali pakuotė',
                desc: 'Grąžinama prekė turi būti nenaudota, nepažeista ir originalioje gamintojo pakuotėje su visomis etiketėmis.',
              },
              {
                icon: '🚫',
                title: 'Kosmetikos prekių grąžinimas',
                desc: 'Kosmetikos prekės, neturinčios kartoninės pakuotės, apsauginės plėvelės ar specialios membranos, po atidarymo negrąžinamos.',
              },
              {
                icon: '🔄',
                title: 'Brokuotos prekės — nemokamai',
                desc: 'Jeigu gavote brokuotą ar netinkamą prekę, susisiekite su mumis — pakeisime nemokamai arba grąžinsime pinigus.',
              },
              {
                icon: '💰',
                title: 'Pinigai grąžinami per 5 d.d.',
                desc: 'Gavus grąžintą prekę, pinigai pervedami į Jūsų sąskaitą per 5 darbo dienas.',
              },
              {
                icon: '📤',
                title: 'Siuntimo išlaidos',
                desc: 'Grąžinimo siuntimo išlaidas dengia pirkėjas, nebent prekė buvo brokuota ar pristatyta netinkamai.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-xl p-7 border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 hover:border-brand-magenta transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-magenta/10 text-[1.4rem] flex items-center justify-center mb-4">
                  <span aria-hidden>{card.icon}</span>
                </div>
                <h4 className="text-[1.05rem] font-bold text-brand-gray-900 mb-2 leading-snug">
                  {card.title}
                </h4>
                <p className="text-[0.9rem] text-brand-gray-500 leading-[1.6]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How to return */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Instrukcija
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Kaip grąžinti prekę?
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Atlikite keturis paprastus žingsnius
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                n: '1',
                icon: '✉',
                title: 'Susisiekite su mumis',
                desc: 'Parašykite mums el. paštu arba užpildykite kontaktų formą nurodydami užsakymo numerį ir grąžinimo priežastį.',
              },
              {
                n: '2',
                icon: '✅',
                title: 'Gaukite patvirtinimą',
                desc: 'Mūsų komanda peržiūrės Jūsų užklausą ir atsiųs grąžinimo patvirtinimą su instrukcijomis.',
              },
              {
                n: '3',
                icon: '🚚',
                title: 'Išsiųskite prekę',
                desc: 'Supakuokite prekę ir išsiųskite nurodytu adresu. Rekomenduojame naudoti siuntimo su sekimu paslaugą.',
              },
              {
                n: '4',
                icon: '💰',
                title: 'Pinigų grąžinimas',
                desc: 'Gavę ir patikrinę prekę, pinigus pervesime į Jūsų nurodytą sąskaitą per 5 darbo dienas.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="relative bg-brand-gray-50 rounded-xl p-8 text-center border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-brand-magenta text-white text-[1rem] font-extrabold flex items-center justify-center shadow-[0_4px_16px_rgba(233,30,140,0.3)]">
                  {step.n}
                </div>
                <div className="text-[2rem] mb-4 mt-2" aria-hidden>
                  {step.icon}
                </div>
                <h4 className="text-[1rem] font-bold text-brand-gray-900 mb-2.5">
                  {step.title}
                </h4>
                <p className="text-[0.88rem] text-brand-gray-500 leading-[1.6]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Returns contact */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Kontaktai grąžinimui
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              Susisiekite dėl grąžinimo
            </h2>
          </div>

          <div
            className={`grid grid-cols-1 ${CONTACT.phone ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 max-w-[920px] mx-auto`}
          >
            {[
              {
                icon: '✉',
                label: 'El. paštas',
                value: CONTACT.email,
                href: `mailto:${CONTACT.email}`,
              },
              ...(CONTACT.phone
                ? [
                    {
                      icon: '☎',
                      label: 'Telefonas',
                      value: CONTACT.phone,
                      href: phoneHref,
                    },
                  ]
                : []),
              {
                icon: '🕓',
                label: 'Darbo laikas',
                value: CONTACT.workingHours,
              },
            ].map((method) => (
              <div
                key={method.label}
                className="flex items-center gap-4 bg-white rounded-xl p-6 border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-brand-magenta/10 text-brand-magenta flex items-center justify-center text-[1.25rem] flex-shrink-0">
                  <span aria-hidden>{method.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[0.78rem] uppercase tracking-wider text-brand-gray-500 font-semibold mb-0.5">
                    {method.label}
                  </div>
                  {method.href ? (
                    <a
                      href={method.href}
                      className="text-[0.95rem] text-brand-gray-900 font-bold hover:text-brand-magenta transition-colors break-all"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <div className="text-[0.95rem] text-brand-gray-900 font-bold">
                      {method.value}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-gray-900 text-white text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
            Pagalba
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
            Turite klausimų?
          </h2>
          <p className="text-[1.1rem] text-white/75 mb-9 max-w-[560px] mx-auto leading-[1.7]">
            Mūsų komanda pasiruošusi padėti. Susisiekite su mumis ir atsakysime
            kuo greičiau.
          </p>
          <Link
            href={`${langPrefix(lang)}/kontaktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            Susisiekti →
          </Link>
        </Container>
      </section>
    </>
  )
}
