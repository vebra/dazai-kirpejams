import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { CONTACT, phoneHref } from '@/lib/site'
import { B2bForm } from './B2bForm'

export const revalidate = 300
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/salonams'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.b2bPage
  return buildPageMetadata({
    lang,
    path: '/salonams',
    title: t.metaTitle,
    description: t.metaDesc,
  })
}

export default async function B2BPage({
  params,
}: PageProps<'/[lang]/salonams'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.b2bPage
  const c = dict.common
  const p = langPrefix(lang)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: c.home, url: `${SITE_URL}/${lang}` },
        { name: t.breadcrumb, url: `${SITE_URL}/${lang}/salonams` },
      ])} />
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link href={`${p || '/'}`} className="hover:text-brand-magenta transition-colors">
            {c.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            {t.breadcrumb}
          </span>
        </Container>
      </section>

      {/* 1. Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.heroBadge}
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2] max-w-[820px] mx-auto">
            {t.heroTitle}{' '}
            <span className="text-brand-magenta">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto mb-9">
            {t.heroSubtitle}
          </p>
          <a
            href="#b2b-forma"
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            {t.heroCta} →
          </a>
        </Container>
      </section>

      {/* 2. Privalumai */}
      <section id="privalumai" className="py-20 bg-white">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.advantagesBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.advantagesTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.advantagesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '💰', title: t.adv1Title, desc: t.adv1Desc },
              { icon: '📦', title: t.adv2Title, desc: t.adv2Desc },
              { icon: '🤝', title: t.adv3Title, desc: t.adv3Desc },
              { icon: '🚚', title: t.adv4Title, desc: t.adv4Desc },
              { icon: '📈', title: t.adv5Title, desc: t.adv5Desc },
              { icon: '🎨', title: t.adv6Title, desc: t.adv6Desc },
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
              {t.stepsBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.stepsTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.stepsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              { n: '1', title: t.step1Title, desc: t.step1Desc },
              { n: '2', title: t.step2Title, desc: t.step2Desc },
              { n: '3', title: t.step3Title, desc: t.step3Desc },
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
              {t.econBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-3 leading-tight">
              {t.econTitle}
            </h2>
            <p className="text-[1.1rem] text-white/70">
              {t.econSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-[60px] items-center mb-12">
            {/* Comparison table */}
            <div className="bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden">
              {[
                { param: t.econParam, std: t.econStd, ours: t.econOurs, header: true },
                { param: t.econVolume, std: '60 ml', ours: '180 ml' },
                { param: t.econPricePkg, std: '€4–6', ours: '€6.99' },
                { param: t.econPriceMl, std: '€0.07–0.10', ours: '€0.039' },
                { param: t.econPkgPer100, std: '~150', ours: '~50' },
                { param: t.econWaste, std: t.econWasteStd, ours: t.econWasteOurs },
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
                  <div className={row.header ? 'text-white' : 'text-white/70 font-medium'}>
                    {row.param}
                  </div>
                  <div className={row.header ? 'text-white' : 'text-white/60 text-center'}>
                    {row.std}
                  </div>
                  <div className={row.header ? 'text-brand-magenta text-right' : 'text-brand-magenta font-bold text-right'}>
                    {row.ours}
                  </div>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div>
              <h3 className="text-[1.5rem] lg:text-[1.75rem] font-bold text-white leading-tight">
                {t.econExplainTitle}
              </h3>
              <p className="mt-4 text-[1.05rem] text-white/75 leading-[1.7]">
                {t.econExplainP1}
              </p>
              <p className="mt-3 text-[1.05rem] text-white/75 leading-[1.7]">
                {t.econExplainP2}{' '}
                <strong className="text-brand-magenta">{t.econExplainHighlight}</strong>
                {t.econExplainP2End}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '3×', label: t.econStat1 },
              { num: '~40%', label: t.econStat2 },
              { num: '↓ 3×', label: t.econStat3 },
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
                {t.formBadge}
              </span>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
                {t.formTitle}
              </h2>
              <p className="text-[1.05rem] text-brand-gray-500 leading-[1.7] mb-8">
                {t.formSubtitle}
              </p>

              <div className="grid gap-3.5">
                {[t.formPerk1, t.formPerk2, t.formPerk3, t.formPerk4].map((perk) => (
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
                {t.formCardTitle}
              </h3>
              <p className="text-[0.9rem] text-brand-gray-500 mb-6">
                {t.formCardSubtitle}
              </p>

              <B2bForm lang={lang} labels={t} />
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Partnerių atsiliepimai */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.reviewsBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.reviewsTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.reviewsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              { quote: t.review1, initials: 'DK', name: t.review1Name, role: t.review1Role },
              { quote: t.review2, initials: 'IG', name: t.review2Name, role: t.review2Role },
              { quote: t.review3, initials: 'RS', name: t.review3Name, role: t.review3Role },
            ].map((r) => (
              <div
                key={r.name}
                className="bg-white rounded-xl p-8 border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="text-[#F5A623] text-[1.1rem] mb-4 tracking-wider">
                  ★★★★★
                </div>
                <p className="text-[0.98rem] text-brand-gray-900 leading-[1.7] italic mb-6">
                  {r.quote}
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-[#E0E0E0]">
                  <div className="w-12 h-12 rounded-full bg-brand-magenta text-white font-bold flex items-center justify-center text-[0.95rem] flex-shrink-0">
                    {r.initials}
                  </div>
                  <div>
                    <div className="text-[0.95rem] font-bold text-brand-gray-900">
                      {r.name}
                    </div>
                    <div className="text-[0.82rem] text-brand-gray-500">
                      {r.role}
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
            {t.ctaBadge}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-[1.1rem] text-white/75 mb-9 max-w-[600px] mx-auto leading-[1.7]">
            {t.ctaSubtitle}
          </p>

          <a
            href="#b2b-forma"
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            {t.ctaCta} →
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
