import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { JsonLd } from '@/components/seo/JsonLd'
import { faqPageSchema } from '@/lib/schema'
import { buildPageMetadata } from '@/lib/seo'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/duk'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/duk',
    title: 'DUK — Dažnai užduodami klausimai',
    description:
      'Atsakymai į pagrindinius klausimus apie profesionalius plaukų dažus, užsakymą, pristatymą, grąžinimą ir B2B bendradarbiavimą.',
  })
}

type FaqItem = { q: string; a: React.ReactNode }
type FaqCategory = {
  icon: string
  title: string
  items: FaqItem[]
}

const faqCategories: FaqCategory[] = [
  {
    icon: '🎨',
    title: 'Apie produktus',
    items: [
      {
        q: 'Kuo jūsų dažai skiriasi nuo kitų profesionalių dažų?',
        a: (
          <>
            Mūsų <strong>Color SHOCK</strong> dažai išsiskiria keliais esminiais
            aspektais:
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>180 ml pakuotė</strong> — dvigubai didesnė nei
                standartinė rinkoje (60–100 ml), todėl kaina už mililitrą yra
                žymiai mažesnė.
              </li>
              <li>
                <strong>Premium ingredientai</strong> — formulėje naudojamas
                Argano aliejus, Jojobos aliejus ir Rožių ekstraktas, kurie
                maitina ir saugo plaukus dažymo metu.
              </li>
              <li>
                <strong>Itališka kokybė</strong> — produktai gaminami Italijoje,
                laikantis aukščiausių kokybės standartų.
              </li>
              <li>
                <strong>Profesionali kaina</strong> — didesnė pakuotė leidžia
                pasiūlyti konkurencingą kainą, neprarandant kokybės.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: 'Kodėl 180 ml pakuotė yra geriau?',
        a: (
          <>
            180 ml pakuotė suteikia akivaizdžių privalumų profesionalams:
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>2× daugiau produkto</strong> — viena pakuotė prilygsta
                dviem standartinių (60–100 ml).
              </li>
              <li>
                <strong>Mažesnė savikaina</strong> — kaina už mililitrą yra
                žymiai ekonomiškesnė.
              </li>
              <li>
                <strong>Mažiau pakuočių</strong> — rečiau reikia užsakyti,
                mažiau atliekų.
              </li>
              <li>
                <strong>Idealu salonams</strong> — didesnė talpa reiškia, kad
                vienos pakuotės užtenka daugiau procedūrų.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: 'Ar dažai tinka visiems plaukų tipams?',
        a: 'Taip. Mūsų dažai sukurti su profesionalia formule, tinkama visiems plaukų tipams — nuo plonių iki tankių, nuo tiesių iki garbanotų. Dažų sudėtyje esantys Argano ir Jojobos aliejai papildomai maitina plaukus, todėl rezultatas būna švelnus ir žvilgantis nepriklausomai nuo plaukų struktūros.',
      },
      {
        q: 'Kokia spalvų paletės apimtis?',
        a: (
          <>
            Šiuo metu siūlome{' '}
            <strong>daugiau nei 50 profesionalių atspalvių</strong>, suskirstytų
            į kategorijas:
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>Natural</strong> — natūralūs tonai
              </li>
              <li>
                <strong>Ash</strong> — peleninių atspalvių serija
              </li>
              <li>
                <strong>Copper</strong> — vario ir šilti tonai
              </li>
              <li>
                <strong>Red</strong> — raudoni atspalviai
              </li>
              <li>
                <strong>Violet</strong> — violetinės serija
              </li>
              <li>
                <strong>Superlift</strong> — intensyvūs šviesinimo tonai
              </li>
              <li>
                <strong>Toner</strong> — tonavimo dažai
              </li>
            </ul>
            Paletė nuolat plečiama, įtraukiant naujus atspalvius.
          </>
        ),
      },
      {
        q: 'Ar galima maišyti spalvas?',
        a: 'Taip, profesionalūs koloristai gali laisvai maišyti skirtingus atspalvius tarpusavyje, kad gautų unikalias, individualias spalvas. Rekomenduojame laikytis profesionalios kolorizacijos principų ir, esant poreikiui, konsultuotis su mūsų komanda dėl optimalių maišymo proporcijų.',
      },
      {
        q: 'Koks oksidantas tinka jūsų dažams?',
        a: (
          <>
            Mūsų dažams tinka oksidantai šių koncentracijų:
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>3% (10 vol.)</strong> — tonavimui ir švelniam dažymui
              </li>
              <li>
                <strong>6% (20 vol.)</strong> — standartiniam dažymui ir žilų
                dengimui
              </li>
              <li>
                <strong>9% (30 vol.)</strong> — šviesinimui 2–3 tonais
              </li>
              <li>
                <strong>12% (40 vol.)</strong> — intensyviam šviesinimui
              </li>
            </ul>
            Maišymo proporcija: <strong>1+2</strong> (1 dalis dažų + 2 dalys
            oksidanto).
          </>
        ),
      },
    ],
  },
  {
    icon: '🛒',
    title: 'Apie užsakymą',
    items: [
      {
        q: 'Kaip užsakyti?',
        a: (
          <>
            Užsakyti labai paprasta:
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Pasirinkite norimus produktus iš katalogo.</li>
              <li>Pridėkite juos į krepšelį paspaudę „+" mygtuką.</li>
              <li>
                Eikite į krepšelį, patikrinkite užsakymą ir užpildykite
                pristatymo informaciją.
              </li>
              <li>Pasirinkite mokėjimo būdą ir patvirtinkite užsakymą.</li>
            </ul>
            Gavus užsakymą, Jūs gausite patvirtinimo laišką el. paštu.
          </>
        ),
      },
      {
        q: 'Kokia minimali užsakymo suma?',
        a: (
          <>
            Individualiems pirkimams minimalios užsakymo sumos nėra — galite
            užsisakyti net ir vieną produktą. <strong>B2B klientams</strong>{' '}
            (salonams, kirpykloms) taikomos individualios sąlygos.
          </>
        ),
      },
      {
        q: 'Kokie mokėjimo būdai?',
        a: (
          <>
            Priimame kelis mokėjimo būdus Jūsų patogumui:
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>Banko pavedimas</strong> — atsiskaitymas pagal
                išankstinę sąskaitą.
              </li>
              <li>
                <strong>Mokėjimo kortelė</strong> — Visa, Mastercard.
              </li>
              <li>
                <strong>Paysera</strong> — greitas ir patogus mokėjimas per
                elektroninę bankų sistemą.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: 'Ar galiu gauti sąskaitą-faktūrą?',
        a: (
          <>
            Taip, <strong>B2B klientams</strong> (įmonėms, salonams) išrašome
            PVM sąskaitas-faktūras. Užsakymo metu nurodykite įmonės rekvizitus
            arba susisiekite su mumis el. paštu{' '}
            <strong>info@dazaikirpejams.lt</strong>.
          </>
        ),
      },
    ],
  },
  {
    icon: '🚚',
    title: 'Apie pristatymą',
    items: [
      {
        q: 'Per kiek laiko pristatote?',
        a: (
          <>
            Užsakymus pristatome per <strong>1–3 darbo dienas</strong> nuo
            užsakymo patvirtinimo ir apmokėjimo. Pristatymo laikas gali skirtis
            priklausomai nuo Jūsų vietos ir pasirinkto pristatymo būdo.
          </>
        ),
      },
      {
        q: 'Kiek kainuoja pristatymas?',
        a: (
          <>
            Pristatymo kaina priklauso nuo pasirinkto būdo.{' '}
            <strong>Užsakymams nuo €50</strong> pristatymas Lietuvoje yra{' '}
            <strong>nemokamas</strong>.
          </>
        ),
      },
      {
        q: 'Ar galima atsiimti?',
        a: (
          <>
            Taip, užsakymą galite <strong>atsiimti asmeniškai Vilniuje</strong>.
            Tikslus atsiėmimo adresas ir laikas bus nurodyti užsakymo
            patvirtinime. Tai nemokama paslauga.
          </>
        ),
      },
      {
        q: 'Kokiose šalyse pristatote?',
        a: (
          <>
            Šiuo metu pristatome visoje <strong>Lietuvoje</strong>. Aktyviai
            plečiame pristatymo geografiją ir artimiausiu metu planuojame
            pradėti siųsti užsakymus į kitas Baltijos šalis.
          </>
        ),
      },
    ],
  },
  {
    icon: '🔄',
    title: 'Apie grąžinimą',
    items: [
      {
        q: 'Ar galiu grąžinti prekes?',
        a: (
          <>
            Taip. Pagal LR įstatymus, Jūs turite teisę grąžinti prekes per{' '}
            <strong>14 dienų</strong> nuo gavimo dienos, jei prekės nebuvo
            atidarytos, naudotos ir išsaugotos originalioje pakuotėje.
            Kosmetikos prekės, neturinčios kartoninės pakuotės, apsauginės
            plėvelės ar specialios membranos, po atidarymo negrąžinamos.
          </>
        ),
      },
      {
        q: 'Per kiek laiko galima grąžinti?',
        a: (
          <>
            Grąžinimo terminas yra <strong>14 kalendorinių dienų</strong> nuo
            prekės gavimo dienos. Per šį laikotarpį turite informuoti mus apie
            savo sprendimą grąžinti prekę.
          </>
        ),
      },
      {
        q: 'Kaip inicijuoti grąžinimą?',
        a: (
          <>
            Norėdami grąžinti prekę, susisiekite el. paštu{' '}
            <strong>info@dazaikirpejams.lt</strong>, nurodydami užsakymo numerį
            ir grąžinimo priežastį. Susisieksime per 1–2 darbo dienas ir
            suderinsime grąžinimo detales.
          </>
        ),
      },
    ],
  },
  {
    icon: '🤝',
    title: 'Apie bendradarbiavimą',
    items: [
      {
        q: 'Ar siūlote nuolaidas salonams?',
        a: (
          <>
            Taip! Grožio salonams, kirpykloms ir profesionaliems koloristams
            siūlome <strong>individualias B2B kainas</strong>, priklausančias
            nuo užsakymų apimčių ir reguliarumo.
          </>
        ),
      },
      {
        q: 'Kaip tapti partneriu?',
        a: (
          <>
            Tapti partneriu labai paprasta: užpildykite B2B formą mūsų
            svetainėje (skyriuje „Salonams") arba susisiekite tiesiogiai el.
            paštu <strong>info@dazaikirpejams.lt</strong>.
          </>
        ),
      },
      {
        q: 'Ar galima gauti testavimo pavyzdžių?',
        a: (
          <>
            Taip, potencialiems <strong>B2B partneriams</strong> (salonams,
            kirpykloms) siūlome galimybę gauti testavimo pavyzdžius, kad
            galėtumėte įvertinti produktų kokybę prieš priimdami sprendimą.
          </>
        ),
      },
    ],
  },
]

function renderAnswerAsText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(renderAnswerAsText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return renderAnswerAsText((node as any).props.children)
  }
  return ''
}

export default async function FaqPage({ params }: PageProps<'/[lang]/duk'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const allQuestions = faqCategories.flatMap((cat) =>
    cat.items.map((item) => ({
      question: item.q,
      answer: renderAnswerAsText(item.a),
    }))
  )
  const faqJsonLd = faqPageSchema(allQuestions)

  return (
    <>
      <JsonLd data={faqJsonLd} />

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
          <span className="text-brand-gray-900 font-medium">DUK</span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2] max-w-[820px] mx-auto">
            Dažniausiai užduodami{' '}
            <span className="text-brand-magenta">klausimai</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[680px] mx-auto">
            Radę atsakymą čia sutaupysite laiko. Jei vis dėlto liko klausimų —
            mūsų komanda visada pasirengusi padėti.
          </p>
        </Container>
      </section>

      {/* FAQ Sections */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-[860px] mx-auto space-y-14">
            {faqCategories.map((cat) => (
              <div key={cat.title}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-magenta/10 text-[1.5rem] flex items-center justify-center flex-shrink-0">
                    <span aria-hidden>{cat.icon}</span>
                  </div>
                  <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-brand-gray-900 leading-tight">
                    {cat.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <details
                      key={item.q}
                      className="group bg-brand-gray-50 rounded-xl border border-transparent hover:border-[#E0E0E0] open:border-brand-magenta open:shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all"
                    >
                      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="text-[1rem] lg:text-[1.05rem] font-semibold text-brand-gray-900 leading-snug">
                          {item.q}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center flex-shrink-0 text-brand-magenta transition-transform group-open:rotate-180">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </summary>
                      <div className="px-6 pb-6 pt-0 text-[0.95rem] text-brand-gray-500 leading-[1.7]">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="bg-brand-gray-900 text-white rounded-2xl p-10 lg:p-14 text-center max-w-[860px] mx-auto">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              Neradote atsakymo?
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[560px] mx-auto leading-[1.7]">
              Susisiekite su mumis ir mūsų komanda mielai padės išspręsti bet
              kurį klausimą.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:info@dazaikirpejams.lt"
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] bg-brand-magenta text-white rounded-lg text-[1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                Rašyti el. laišką →
              </a>
              <Link
                href={`${langPrefix(lang)}/kontaktai`}
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] border-2 border-white/30 text-white rounded-lg text-[1rem] font-semibold hover:bg-white hover:text-brand-gray-900 hover:border-white hover:-translate-y-0.5 transition-all"
              >
                Kontaktai
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
