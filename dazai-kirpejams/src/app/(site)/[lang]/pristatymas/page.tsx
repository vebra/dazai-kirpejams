import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { CONTACT, phoneHref } from '@/lib/site'
import { langPrefix } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pristatymas'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.deliveryPage
  return buildPageMetadata({
    lang,
    path: '/pristatymas',
    title: t.metaTitle,
    description: t.metaDesc,
  })
}

export default async function DeliveryPage({
  params,
}: PageProps<'/[lang]/pristatymas'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.deliveryPage
  const c = dict.common
  const p = langPrefix(lang)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: c.home, url: buildCanonicalUrl(lang, '/') },
        { name: t.breadcrumb, url: buildCanonicalUrl(lang, '/pristatymas') },
      ])} />
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${p || '/'}`}
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
            {t.heroBadge}
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2] max-w-[820px] mx-auto">
            {t.heroTitle}{' '}
            <span className="text-brand-magenta">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[680px] mx-auto">
            {t.heroSubtitle}
          </p>
        </Container>
      </section>

      {/* Shipping methods */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.shippingBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.shippingTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.shippingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              { icon: '🚚', title: t.courierTitle, desc: t.courierDesc, time: t.courierTime },
              { icon: '📦', title: t.parcelTitle, desc: t.parcelDesc, time: t.parcelTime },
              { icon: '🏢', title: t.pickupTitle, desc: t.pickupDesc, time: t.pickupTime },
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
              {t.priceTableTitle}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[0.95rem]">
                <thead>
                  <tr className="border-b-2 border-[#E0E0E0]">
                    <th className="text-left py-3 pr-4 font-bold text-brand-gray-900">
                      {t.priceColMethod}
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-brand-gray-900">
                      {t.priceColTerm}
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-brand-gray-900">
                      {t.priceColPrice}
                    </th>
                    <th className="text-left py-3 pl-4 font-bold text-brand-gray-900">
                      {t.priceColFree}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { method: `🚚 ${t.courierTitle}`, term: t.courierTime, price: '€3,99', free: true },
                    { method: '📦 LP EXPRESS', term: t.parcelTime, price: '€2,49', free: true },
                    { method: '📦 Omniva', term: t.parcelTime, price: '€2,49', free: true },
                    { method: `🏢 ${t.pickupTitle}`, term: t.pickupTime, price: t.free, free: true, priceIsFree: true },
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
                            {t.free}
                          </strong>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-[0.9rem] text-brand-gray-500 text-center">
              🌍 <strong>{t.shippingTerritory}</strong>
            </p>
          </div>

          {/* Free shipping banner */}
          <div className="mt-10 bg-brand-magenta rounded-xl p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-6 text-white max-w-[920px] mx-auto">
            <div className="text-[3rem] flex-shrink-0" aria-hidden>
              🎁
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-[1.2rem] font-bold mb-1.5">
                {t.freeShippingTitle}
              </h4>
              <p className="text-[0.95rem] text-white/90 leading-[1.6]">
                {t.freeShippingDesc}
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
              {t.returnsBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.returnsTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.returnsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📅', title: t.ret1Title, desc: t.ret1Desc },
              { icon: '📦', title: t.ret2Title, desc: t.ret2Desc },
              { icon: '🚫', title: t.ret3Title, desc: t.ret3Desc },
              { icon: '🔄', title: t.ret4Title, desc: t.ret4Desc },
              { icon: '💰', title: t.ret5Title, desc: t.ret5Desc },
              { icon: '📤', title: t.ret6Title, desc: t.ret6Desc },
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
              {t.howReturnBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.howReturnTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.howReturnSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '1', icon: '✉', title: t.howRet1Title, desc: t.howRet1Desc },
              { n: '2', icon: '✅', title: t.howRet2Title, desc: t.howRet2Desc },
              { n: '3', icon: '🚚', title: t.howRet3Title, desc: t.howRet3Desc },
              { n: '4', icon: '💰', title: t.howRet4Title, desc: t.howRet4Desc },
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
              {t.returnContactBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              {t.returnContactTitle}
            </h2>
          </div>

          <div
            className={`grid grid-cols-1 ${CONTACT.phone ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 max-w-[920px] mx-auto`}
          >
            {[
              {
                icon: '✉',
                label: dict.contactPage.email,
                value: CONTACT.email,
                href: `mailto:${CONTACT.email}`,
              },
              ...(CONTACT.phone
                ? [
                    {
                      icon: '☎',
                      label: dict.contactPage.phone,
                      value: CONTACT.phone,
                      href: phoneHref,
                    },
                  ]
                : []),
              {
                icon: '🕓',
                label: dict.contactPage.workingHours,
                value: dict.common.workingHoursDisplay,
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
            {t.ctaBadge}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-[1.1rem] text-white/75 mb-9 max-w-[560px] mx-auto leading-[1.7]">
            {t.ctaSubtitle}
          </p>
          <Link
            href={`${p}/kontaktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            {t.ctaCta}
          </Link>
        </Container>
      </section>
    </>
  )
}
