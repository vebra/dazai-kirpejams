import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { Calculator } from '@/components/calculator/Calculator'
import { buildPageMetadata } from '@/lib/seo'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/skaiciuokle'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/skaiciuokle',
    title: 'Kainų skaičiuoklė — 180 ml vs standartinė pakuotė',
    description:
      'Suskaičiuokite, kiek Jūsų salonas sutaupo rinkdamasis Color SHOCK 180 ml pakuotę vietoj standartinės. Įveskite savo duomenis ir pamatykite realų skirtumą.',
  })
}

export default async function CalculatorPage({
  params,
}: PageProps<'/[lang]/skaiciuokle'>) {
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
            Kainų skaičiuoklė
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Sutaupykite su 180 ml
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            Kainų <span className="text-brand-magenta">skaičiuoklė</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            Suskaičiuokite, kiek Jūsų salonas sutaupo rinkdamasis Color SHOCK
            180 ml pakuotę vietoj standartinės. Įveskite savo duomenis ir
            pamatykite realų skirtumą.
          </p>
        </Container>
      </section>

      {/* Calculator */}
      <section className="py-16 bg-white">
        <Container>
          <Calculator />
        </Container>
      </section>

      {/* Visual comparison */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Palyginimas
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              Standartinė pakuotė{' '}
              <span className="text-brand-gray-500 font-normal italic">
                vs
              </span>{' '}
              Color SHOCK
            </h2>
            <p className="text-[1.05rem] text-brand-gray-500">
              Pamatykite skirtumą — skaičiai kalba patys.
            </p>
          </div>

          <div className="max-w-[820px] mx-auto bg-white rounded-xl p-6 lg:p-10 border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[0.95rem]">
                <thead>
                  <tr className="border-b-2 border-[#E0E0E0]">
                    <th className="text-left py-4 pr-4 font-bold text-brand-gray-500 uppercase tracking-wider text-[0.75rem]"></th>
                    <th className="text-center py-4 px-4 font-bold text-brand-gray-900">
                      Standartinė pakuotė
                    </th>
                    <th className="text-center py-4 pl-4 font-bold text-brand-magenta bg-brand-magenta/[0.05]">
                      Color SHOCK
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Talpa', std: '60 ml', ours: '180 ml' },
                    { label: 'Kaina', std: '~€10,00', ours: '€7,99' },
                    {
                      label: 'Kaina per ml',
                      std: '~€0,167',
                      ours: '€0,044',
                    },
                    {
                      label: 'Pakuočių per mėnesį*',
                      std: '~60 vnt.',
                      ours: '~20 vnt. (3× mažiau)',
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-[#E0E0E0] last:border-b-0"
                    >
                      <td className="py-4 pr-4 font-semibold text-brand-gray-900">
                        {row.label}
                      </td>
                      <td className="py-4 px-4 text-center text-brand-gray-500">
                        {row.std}
                      </td>
                      <td className="py-4 pl-4 text-center text-brand-magenta font-bold bg-brand-magenta/[0.05]">
                        {row.ours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-[0.82rem] text-brand-gray-500 italic text-center">
              * Skaičiuojant 15 dažymų per savaitę, 60 ml vienam dažymui.
            </p>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              Kodėl verta
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              Trys priežastys rinktis 180 ml
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💰',
                title: 'Mažesnė savikaina',
                desc: 'Kaina per ml yra iki 3,7 karto mažesnė nei standartinės pakuotės. Tai reiškia realų sutaupymą kiekvieną dieną.',
              },
              {
                icon: '📦',
                title: 'Mažiau pakuočių',
                desc: 'Su 180 ml pakuote Jums reikia 3 kartus mažiau vienetų tam pačiam darbui atlikti. Mažiau užsakymų, mažiau atliekų.',
              },
              {
                icon: '📈',
                title: 'Didesnis pelningumas',
                desc: 'Sutaupytos lėšos tiesiogiai didina Jūsų salono pelningumą. Per metus tai gali siekti šimtus eurų.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-brand-gray-50 rounded-xl p-10 px-8 text-center border border-transparent hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] flex items-center justify-center text-[2rem] mb-5">
                  <span aria-hidden>{card.icon}</span>
                </div>
                <h3 className="text-[1.15rem] font-bold text-brand-gray-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-[0.92rem] text-brand-gray-500 leading-[1.6]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-20 bg-white">
        <Container>
          <div className="bg-brand-gray-900 text-white rounded-2xl p-10 lg:p-16 text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              Išbandykite patys
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[600px] mx-auto leading-[1.7]">
              Peržiūrėkite Color SHOCK produktų asortimentą ir įsitikinkite 180
              ml pranašumu savo salone.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`${langPrefix(lang)}/produktai`}
                className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                Peržiūrėti produktus →
              </Link>
              <Link
                href={`${langPrefix(lang)}/salonams`}
                className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-white/30 text-white rounded-lg text-[1.1rem] font-semibold hover:bg-white hover:text-brand-gray-900 hover:border-white hover:-translate-y-0.5 transition-all"
              >
                Gauti pasiūlymą salonui
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
