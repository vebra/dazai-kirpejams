import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { Calculator } from '@/components/calculator/Calculator'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { langPrefix } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/skaiciuokle'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.calculatorPage
  return buildPageMetadata({
    lang,
    path: '/skaiciuokle',
    title: t.metaTitle,
    description: t.metaDesc,
  })
}

export default async function CalculatorPage({
  params,
}: PageProps<'/[lang]/skaiciuokle'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.calculatorPage
  const c = dict.common

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: c.home, url: buildCanonicalUrl(lang, '/') },
        { name: t.breadcrumb, url: buildCanonicalUrl(lang, '/skaiciuokle') },
      ])} />
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {c.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            {t.breadcrumb}
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.badge}
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            {t.title} <span className="text-brand-magenta">{t.titleHighlight}</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            {t.subtitle}
          </p>
        </Container>
      </section>

      {/* Calculator */}
      <section className="py-16 bg-white">
        <Container>
          <Calculator dict={t} />
        </Container>
      </section>

      {/* Visual comparison */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.comparisonBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.comparisonTitle}{' '}
              <span className="text-brand-gray-500 font-normal italic">
                {t.comparisonVs}
              </span>{' '}
              {t.comparisonEnd}
            </h2>
            <p className="text-[1.05rem] text-brand-gray-500">
              {t.comparisonDesc}
            </p>
          </div>

          <div className="max-w-[820px] mx-auto bg-white rounded-xl p-6 lg:p-10 border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[0.95rem]">
                <thead>
                  <tr className="border-b-2 border-[#E0E0E0]">
                    <th className="text-left py-4 pr-4 font-bold text-brand-gray-500 uppercase tracking-wider text-[0.75rem]"></th>
                    <th className="text-center py-4 px-4 font-bold text-brand-gray-900">
                      {t.tableStdHeader}
                    </th>
                    <th className="text-center py-4 pl-4 font-bold text-brand-magenta bg-brand-magenta/[0.05]">
                      {t.tableOurHeader}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: t.rowVolume, std: '60 ml', ours: '180 ml' },
                    { label: t.rowPrice, std: '~€11,00', ours: '€7,90' },
                    {
                      label: t.rowPriceMl,
                      std: '~€0,183',
                      ours: '€0,044',
                    },
                    {
                      label: t.rowPackages,
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
              {t.tableFootnote}
            </p>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.benefitsBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              {t.benefitsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💰',
                title: t.benefit1Title,
                desc: t.benefit1Desc,
              },
              {
                icon: '📦',
                title: t.benefit2Title,
                desc: t.benefit2Desc,
              },
              {
                icon: '📈',
                title: t.benefit3Title,
                desc: t.benefit3Desc,
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
              {t.ctaTitle}
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[600px] mx-auto leading-[1.7]">
              {t.ctaDesc}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`${langPrefix(lang)}/produktai`}
                className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {t.ctaProducts}
              </Link>
              <Link
                href={`${langPrefix(lang)}/salonams`}
                className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-white/30 text-white rounded-lg text-[1.1rem] font-semibold hover:bg-white hover:text-brand-gray-900 hover:border-white hover:-translate-y-0.5 transition-all"
              >
                {t.ctaSalons}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
