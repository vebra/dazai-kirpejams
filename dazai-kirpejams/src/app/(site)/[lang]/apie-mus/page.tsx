import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/apie-mus'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/apie-mus',
    title: 'Apie mus — Dažai Kirpėjams',
    description:
      'Aprūpiname Lietuvos kirpėjus ir salonus profesionaliais darbo įrankiais. Mūsų misija — kokybiški, ekonomiški dažai 180 ml talpoje.',
  })
}

export default async function AboutPage({
  params,
}: PageProps<'/[lang]/apie-mus'>) {
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
          <span className="text-brand-gray-900 font-medium">Apie mus</span>
        </Container>
      </section>

      {/* 1. Hero */}
      <section className="py-8 lg:py-16 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                Apie mus
              </span>
              <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.2] text-brand-gray-900 mb-5">
                Mes aprūpiname kirpėjus darbo įrankiais, kuriais galima{' '}
                <span className="text-brand-magenta">pasitikėti</span>
              </h1>
              <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7]">
                Mūsų tikslas paprastas — padėti kirpėjams ir koloristams dirbti
                efektyviau. Profesionalūs produktai, protinga kaina ir tikra
                vertė kasdieniam darbui salone.
              </p>
            </div>
            <div className="aspect-[4/3] bg-brand-gray-50 rounded-xl border-2 border-dashed border-[#E0E0E0] flex flex-col items-center justify-center gap-3">
              <div className="text-[3rem] opacity-40" aria-hidden>
                ✂
              </div>
              <p className="text-[0.9rem] text-brand-gray-500 opacity-60">
                Profesionali atmosfera
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Mūsų istorija */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-[780px] mx-auto text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Mūsų istorija
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-8 leading-tight">
              Kaip viskas prasidėjo
            </h2>
            <div className="text-left space-y-5">
              <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500">
                Viskas prasidėjo nuo paprasto pastebėjimo: Lietuvos kirpėjai
                moka per daug už profesionalius plaukų dažus. Daugelis tiekėjų
                siūlo 60–100 ml pakuotes už kainas, kurios ne visada atitinka
                darbo realybę. Kirpėjai kasdien naudoja dažus — tai jų
                pagrindinis darbo įrankis, o ne prabangos prekė. Mes
                nusprendėme, kad galima kitaip.
              </p>
              <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500">
                Užmezgėme tiesioginius ryšius su Italijos gamintojais ir į
                Lietuvos rinką atvežėme Color SHOCK — profesionalių plaukų
                dažų liniją 180 ml pakuotėse. Tai dvigubai ar trigubai daugiau
                nei standartinė pakuotė rinkoje. Formulė su Argan ir Jojoba
                aliejais bei rožių ekstraktu užtikrina kokybišką rezultatą, o
                didesnė talpa reiškia mažesnę savikainą kiekvienam dažymui.
                Greta Color SHOCK pasiūlėme ir RosaNera Cosmetic —
                profesionalią plaukų priežiūros liniją, kuri puikiai papildo
                dažymo procesą.
              </p>
              <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500">
                Šiandien dirbame su kirpėjais, koloristais ir grožio salonais
                visoje Lietuvoje. Nesiekiame būti dar viena „grožio" kompanija
                su tuščiais pažadais. Mūsų požiūris pragmatiškas: geras darbo
                įrankis turi būti patikimas, ekonomiškas ir lengvai
                prieinamas. Būtent tai mes ir siūlome.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Misija — juodas blokas */}
      <section className="py-20 bg-brand-gray-900 text-white">
        <Container>
          <div className="text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
              Misija
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              Ką mes darome ir kodėl
            </h2>
            <p className="text-[1.1rem] text-white/75 max-w-[640px] mx-auto mb-12 leading-[1.7]">
              Mūsų misija — aprūpinti kirpėjus kokybiškais, ekonomiškais darbo
              įrankiais. Ne „grožio" industrijos klišės, o praktinė nauda
              kasdieniam darbui.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[
                {
                  icon: '💪',
                  title: 'Kokybė be permokėjimo',
                  desc:
                    'Profesionali formulė iš Italijos — kokybiški ingredientai už protingą kainą. Didesnė pakuotė reiškia mažesnę savikainą.',
                },
                {
                  icon: '⚙',
                  title: 'Orientacija į praktiką',
                  desc:
                    'Kiekvienas mūsų sprendimas grindžiamas vienu klausimu: ar tai palengvina kirpėjo kasdienį darbą?',
                },
                {
                  icon: '🤝',
                  title: 'Profesionalams — ne visiems',
                  desc:
                    'Dirbame tik su profesionalais. Suprantame jų poreikius, todėl galime pasiūlyti tiksliai tai, ko reikia.',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white/[0.06] border border-white/10 rounded-xl p-9 px-7 text-center hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all"
                >
                  <div className="text-[2rem] mb-4" aria-hidden>
                    {card.icon}
                  </div>
                  <h4 className="text-[1.05rem] font-bold text-white mb-2.5">
                    {card.title}
                  </h4>
                  <p className="text-[0.92rem] text-white/65 leading-[1.6]">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Prekių ženklai */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Prekių ženklai
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Produktai, kuriais pasitiki profesionalai
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              Du prekių ženklai — viskas, ko reikia profesionaliam darbui
              salone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: '🎨',
                name: 'Color SHOCK',
                tagline: 'Profesionalūs plaukų dažai',
                features: [
                  '50+ profesionalių atspalvių',
                  '180 ml ekonominė pakuotė',
                  'Argan & Jojoba aliejai',
                  'Rožių ekstraktas',
                  'Itališka kokybė',
                  'Maišymo santykis 1+2',
                ],
                cta: { label: 'Peržiūrėti dažus →', href: `/${lang}/produktai/dazai`, variant: 'primary' as const },
              },
              {
                icon: '🧴',
                name: 'RosaNera Cosmetic',
                tagline: 'Profesionali plaukų priežiūra',
                features: [
                  'Profesionalūs šampūnai',
                  'Plaukų kaukės ir priežiūra',
                  'Papildomi produktai',
                  'Tinka po dažymo',
                  'Saloninė kokybė',
                  'Papildo Color SHOCK liniją',
                ],
                cta: { label: 'Peržiūrėti produktus →', href: `/${lang}/produktai/sampunai`, variant: 'outline' as const },
              },
            ].map((brand) => (
              <div
                key={brand.name}
                className="bg-white rounded-xl p-12 px-9 text-center border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 hover:border-brand-magenta transition-all"
              >
                <div className="text-[3rem] mb-5" aria-hidden>
                  {brand.icon}
                </div>
                <h3 className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-bold text-brand-gray-900 mb-2">
                  {brand.name}
                </h3>
                <p className="text-[0.95rem] text-brand-magenta font-semibold mb-6">
                  {brand.tagline}
                </p>
                <ul className="text-left max-w-[280px] mx-auto mb-7 space-y-2.5">
                  {brand.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-[0.92rem] text-brand-gray-500 leading-snug"
                    >
                      <span className="text-brand-magenta font-bold text-[0.85rem] flex-shrink-0">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={brand.cta.href}
                  className={
                    brand.cta.variant === 'primary'
                      ? 'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-magenta text-white rounded-lg text-[0.9rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all'
                      : 'inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-brand-magenta text-brand-magenta rounded-lg text-[0.9rem] font-semibold hover:bg-brand-magenta hover:text-white hover:-translate-y-0.5 transition-all'
                  }
                >
                  {brand.cta.label}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. Skaičiai */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Skaičiai
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              Faktai, kurie kalba už mus
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: '50+', label: 'spalvų paletėje' },
              { number: '180 ml', label: 'mūsų standartas' },
              { number: '100+', label: 'patenkintų klientų' },
              { number: 'Italija', label: 'gamybos šalis' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-brand-gray-50 rounded-xl p-10 px-6 text-center border border-transparent hover:border-brand-magenta hover:shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all"
              >
                <div className="text-[2.5rem] font-extrabold text-brand-magenta leading-none mb-3">
                  {stat.number}
                </div>
                <div className="text-[0.95rem] text-brand-gray-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. CTA */}
      <section className="py-20 bg-brand-gray-50 text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Pradėkite dabar
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
            Pasiruošę išbandyti?
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500 mb-9 max-w-[560px] mx-auto leading-[1.7]">
            Profesionalūs dažai su 180 ml talpa — daugiau vertės kiekvienam
            dažymui Jūsų salone.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${lang}/produktai`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              Peržiūrėti produktus →
            </Link>
            <Link
              href={`/${lang}/kontaktai`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.1rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
            >
              Susisiekite su mumis
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
