import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata } from '@/lib/seo'
import { CONTACT, phoneHref } from '@/lib/site'
import { B2bForm } from './B2bForm'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/salonams'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/salonams',
    title: 'Bendradarbiavimas salonams — B2B specialios sąlygos',
    description:
      'Specialios sąlygos grožio salonams ir kirpykloms. Individualios kainos, reguliarus tiekimas, asmeninis vadybininkas. Gaukite pasiūlymą jau šiandien.',
  })
}

export default async function B2BPage({
  params,
}: PageProps<'/[lang]/salonams'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link href={`/${lang}`} className="hover:text-brand-magenta transition-colors">
            Pradžia
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            Bendradarbiavimas salonams
          </span>
        </Container>
      </section>

      {/* 1. Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            B2B bendradarbiavimas
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2] max-w-[820px] mx-auto">
            Specialios sąlygos{' '}
            <span className="text-brand-magenta">grožio salonams</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto mb-9">
            Gaukite profesionalius dažus ir priemones geriausiomis kainomis.
            Individualus pasiūlymas, reguliarus tiekimas ir asmeninis
            vadybininkas — viskas, ko reikia Jūsų salonui.
          </p>
          <a
            href="#b2b-forma"
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            Gauti pasiūlymą →
          </a>
        </Container>
      </section>

      {/* 2. Privalumai */}
      <section id="privalumai" className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Privalumai
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Kodėl salonai renkasi mus?
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Sukuriame sąlygas, kad Jūsų salonas dirbtų efektyviau ir
              pelningiau
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '💰',
                title: 'Individualios kainos dideliems užsakymams',
                desc:
                  'Kuo didesnis užsakymas — tuo geresnė kaina. Kiekvienas salonas gauna pasiūlymą, pritaikytą būtent jo poreikiams ir apimtims.',
              },
              {
                icon: '📦',
                title: 'Reguliaraus tiekimo galimybė',
                desc:
                  'Sutarkite pastovų pristatymo grafiką — dažai visada bus laiku. Jokio streso dėl pasibaigusių atsargų.',
              },
              {
                icon: '🤝',
                title: 'Asmeninis vadybininkas',
                desc:
                  'Kiekvienam salonui priskiriamas asmeninis vadybininkas, kuris pasirūpins užsakymais, patarimais ir operatyviu aptarnavimu.',
              },
              {
                icon: '🚚',
                title: 'Greitas pristatymas',
                desc:
                  'Pristatymas per 1–3 darbo dienas visoje Lietuvoje. Neatidėliotini užsakymai — galimybė gauti kitą darbo dieną.',
              },
              {
                icon: '📈',
                title: '180 ml ekonominė nauda salonams',
                desc:
                  'Didesnė pakuotė reiškia mažesnę savikainą kiekvienam dažymui. 180 ml — tai 3× daugiau produkto nei standartinis 60 ml.',
              },
              {
                icon: '🎨',
                title: 'Galimybė testuoti produktus',
                desc:
                  'Prieš užsisakydami didelį kiekį, galite išbandyti produktus savo salone. Patvirtinkite kokybę praktiškai.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-brand-gray-50 rounded-xl p-8 border border-transparent hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] flex items-center justify-center text-[1.6rem] mb-5">
                  <span aria-hidden>{card.icon}</span>
                </div>
                <h4 className="text-[1.05rem] font-bold text-brand-gray-900 mb-2.5 leading-snug">
                  {card.title}
                </h4>
                <p className="text-[0.92rem] text-brand-gray-500 leading-[1.6]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Kaip tai veikia */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Kaip tai veikia
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Trys paprasti žingsniai
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Pradėti bendradarbiauti su mumis — paprasta ir greita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              {
                n: '1',
                title: 'Pateikite užklausą',
                desc:
                  'Užpildykite žemiau esančią formą arba susisiekite el. paštu. Nurodykite salono poreikius ir pageidavimus.',
              },
              {
                n: '2',
                title: 'Gausite individualų pasiūlymą',
                desc:
                  'Per 1 darbo dieną mūsų vadybininkas parengs ir atsiųs Jūsų salonui pritaikytą kainų pasiūlymą.',
              },
              {
                n: '3',
                title: 'Pradėkite bendradarbiavimą',
                desc:
                  'Sutarkite pristatymo grafiką, gaukite produktus ir pradėkite dirbti su kokybiškais dažais geriausia kaina.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="relative bg-white rounded-xl p-10 px-8 text-center border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-brand-magenta text-white text-[1.4rem] font-extrabold flex items-center justify-center shadow-[0_4px_16px_rgba(233,30,140,0.3)]">
                  {step.n}
                </div>
                <h4 className="text-[1.1rem] font-bold text-brand-gray-900 mb-3">
                  {step.title}
                </h4>
                <p className="text-[0.92rem] text-brand-gray-500 leading-[1.6]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Ekonominė nauda — juodas blokas */}
      <section id="ekonomija" className="py-20 bg-brand-gray-900 text-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Ekonominė nauda
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-3 leading-tight">
              180 ml pranašumas Jūsų salonui
            </h2>
            <p className="text-[1.1rem] text-white/70">
              Palyginimas su standartinėmis 60 ml pakuotėmis rinkoje
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-[60px] items-center mb-12">
            {/* Comparison table */}
            <div className="bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden">
              {[
                {
                  param: 'Parametras',
                  std: 'Standartinė (60 ml)',
                  ours: 'Mūsų (180 ml)',
                  header: true,
                },
                { param: 'Pakuotės tūris', std: '60 ml', ours: '180 ml' },
                { param: 'Kaina už pakuotę', std: '€4–6', ours: '€6.99' },
                {
                  param: 'Kaina už 1 ml',
                  std: '€0.07–0.10',
                  ours: '€0.039',
                },
                {
                  param: 'Pakuotės / 100 dažymų',
                  std: '~150 vnt.',
                  ours: '~50 vnt.',
                },
                { param: 'Pakuočių atliekos', std: 'Daug', ours: '3× mažiau' },
              ].map((row, i) => (
                <div
                  key={row.param}
                  className={`grid grid-cols-3 gap-2 px-5 py-4 text-[0.92rem] ${
                    row.header
                      ? 'bg-white/10 font-bold text-white uppercase tracking-wider text-[0.75rem]'
                      : i % 2 === 0
                        ? 'bg-white/[0.02]'
                        : ''
                  } ${!row.header && i < 5 ? 'border-t border-white/10' : ''}`}
                >
                  <div
                    className={
                      row.header ? 'text-white' : 'text-white/70 font-medium'
                    }
                  >
                    {row.param}
                  </div>
                  <div
                    className={
                      row.header ? 'text-white' : 'text-white/60 text-center'
                    }
                  >
                    {row.std}
                  </div>
                  <div
                    className={
                      row.header
                        ? 'text-brand-magenta text-right'
                        : 'text-brand-magenta font-bold text-right'
                    }
                  >
                    {row.ours}
                  </div>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div>
              <h3 className="text-[1.5rem] lg:text-[1.75rem] font-bold text-white leading-tight">
                Daugiau produkto. Mažesnė savikaina.
              </h3>
              <p className="mt-4 text-[1.05rem] text-white/75 leading-[1.7]">
                Viena mūsų 180 ml pakuotė prilygsta trims standartinėms 60 ml
                pakuotėms. Tai reiškia žymiai mažesnes išlaidas kiekvienam
                dažymui ir mažiau užsakymų per mėnesį.
              </p>
              <p className="mt-3 text-[1.05rem] text-white/75 leading-[1.7]">
                Salonams, atliekantiems 20+ dažymų per mėnesį, sutaupymas gali
                siekti iki{' '}
                <strong className="text-brand-magenta">
                  40% nuo įprastų dažų išlaidų
                </strong>
                . O pridėjus B2B nuolaidą — ekonomija tampa dar didesnė.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '3×', label: 'Daugiau produkto vienoje pakuotėje' },
              { num: '~40%', label: 'Mažesnė kaina už 1 ml' },
              { num: '↓ 3×', label: 'Mažiau pakuočių atliekų' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/[0.06] border border-white/10 rounded-xl p-8 text-center hover:bg-white/10 transition-colors"
              >
                <div className="text-[2.5rem] font-extrabold text-brand-magenta leading-none mb-3">
                  {stat.num}
                </div>
                <div className="text-[0.95rem] text-white/70 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. B2B forma */}
      <section id="b2b-forma" className="py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-[60px] items-start">
            {/* Info */}
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                Užklausa
              </span>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
                Gaukite individualų pasiūlymą
              </h2>
              <p className="text-[1.05rem] text-brand-gray-500 leading-[1.7] mb-8">
                Užpildykite formą ir mūsų vadybininkas susisieks su Jumis per 1
                darbo dieną. Parengsime pasiūlymą, pritaikytą būtent Jūsų
                salono poreikiams.
              </p>

              <div className="grid gap-3.5">
                {[
                  'Atsakome per 1 darbo dieną',
                  'Individualios kainos nuo pirmo užsakymo',
                  'Nemokamas produkto testavimas',
                  'Be įsipareigojimų',
                ].map((perk) => (
                  <div
                    key={perk}
                    className="flex items-center gap-3 text-[0.95rem] text-brand-gray-900 font-medium"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-magenta/10 text-brand-magenta flex items-center justify-center text-[0.85rem] font-bold flex-shrink-0">
                      ✓
                    </div>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="bg-brand-gray-50 rounded-xl p-8 lg:p-10 border border-[#E0E0E0]">
              <h3 className="text-[1.35rem] font-bold text-brand-gray-900 mb-1.5">
                Pateikite užklausą
              </h3>
              <p className="text-[0.9rem] text-brand-gray-500 mb-6">
                Laukai pažymėti{' '}
                <span className="text-brand-magenta">*</span> yra privalomi
              </p>

              <B2bForm lang={lang} />
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Partnerių atsiliepimai */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Atsiliepimai
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Ką sako mūsų partneriai
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Salonai, kurie jau bendradarbiauja su mumis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              {
                quote:
                  '„Perėjome prie 180 ml pakuočių prieš pusę metų ir jau matome reikšmingą sutaupymą. Asmeninis vadybininkas visada pasiekiamas, o pristatymas — punktualus."',
                initials: 'DK',
                name: 'Diana K.',
                role: 'Salono savininkė, Kaunas',
              },
              {
                quote:
                  '„Labai patogi bendradarbiavimo sistema. Užsisakome reguliariai, kainos nuostabios, o kokybė nenusileidžia brangesnėms prekių markėms. Mūsų koloristės patenkintos."',
                initials: 'IG',
                name: 'Ieva G.',
                role: 'Grožio studija, Vilnius',
              },
              {
                quote:
                  '„Turime tris salonus ir visiems gauname vienodai geras sąlygas. Ypatingai vertiname galimybę testuoti naujus atspalvius prieš užsisakant didelį kiekį."',
                initials: 'RS',
                name: 'Rasa S.',
                role: 'Salonų tinklo vadovė, Klaipėda',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl p-8 border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="text-[#F5A623] text-[1.1rem] mb-4 tracking-wider">
                  ★★★★★
                </div>
                <p className="text-[0.98rem] text-brand-gray-900 leading-[1.7] italic mb-6">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-[#E0E0E0]">
                  <div className="w-12 h-12 rounded-full bg-brand-magenta text-white font-bold flex items-center justify-center text-[0.95rem] flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[0.95rem] font-bold text-brand-gray-900">
                      {t.name}
                    </div>
                    <div className="text-[0.82rem] text-brand-gray-500">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 7. Final CTA — juodas blokas */}
      <section className="py-20 bg-brand-gray-900 text-white text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
            Pradėkite dabar
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
            Pasiruošę pradėti?
          </h2>
          <p className="text-[1.1rem] text-white/75 mb-9 max-w-[600px] mx-auto leading-[1.7]">
            Susisiekite su mumis patogiu būdu ir gaukite individualų pasiūlymą
            Jūsų salonui jau šiandien.
          </p>

          <a
            href="#b2b-forma"
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            Užpildyti užklausos formą →
          </a>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/20 bg-white/[0.06] text-[0.95rem] font-medium text-white hover:border-brand-magenta hover:bg-brand-magenta/10 transition-all"
            >
              <span aria-hidden>✉</span>
              {CONTACT.email}
            </a>
            {CONTACT.phone && (
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/20 bg-white/[0.06] text-[0.95rem] font-medium text-white hover:border-brand-magenta hover:bg-brand-magenta/10 transition-all"
              >
                <span aria-hidden>☎</span>
                {CONTACT.phone}
              </a>
            )}
          </div>
        </Container>
      </section>
    </>
  )
}

