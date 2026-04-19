import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { langPrefix } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/apie-mus'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.aboutPage
  const base = buildPageMetadata({
    lang,
    path: '/apie-mus',
    title: t.metaTitle,
    description: t.metaDesc,
  })
  const ogImage =
    lang === 'en'
      ? '/about-us.webp'
      : lang === 'ru'
        ? '/o-nas.webp'
        : '/apie-mus-hero.webp'
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [{ url: `${SITE_URL}${ogImage}`, width: 1262, height: 1577, alt: t.metaTitle }],
    },
    twitter: {
      ...base.twitter,
      images: [`${SITE_URL}${ogImage}`],
    },
  }
}

export default async function AboutPage({
  params,
}: PageProps<'/[lang]/apie-mus'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.aboutPage
  const c = dict.common
  const p = langPrefix(lang)

  const heroImage =
    lang === 'en' ? '/about-us.webp' : lang === 'ru' ? '/o-nas.webp' : '/apie-mus-hero.webp'

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: c.home, url: buildCanonicalUrl(lang, '/') },
        { name: t.badge, url: buildCanonicalUrl(lang, '/apie-mus') },
      ])} />
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link href={`${p || '/'}`} className="hover:text-brand-magenta transition-colors">
            {c.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">{t.badge}</span>
        </Container>
      </section>

      {/* 1. Hero */}
      <section className="py-8 lg:py-16 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                {t.badge}
              </span>
              <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.2] text-brand-gray-900 mb-5">
                {t.title}{' '}
                <span className="text-brand-magenta">{t.titleHighlight}</span>
              </h1>
              <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7]">
                {t.subtitle}
              </p>
            </div>
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
              <Image
                src={heroImage}
                alt={t.imagePlaceholder}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Mūsų istorija */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-[780px] mx-auto text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.storyBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-8 leading-tight">
              {t.storyTitle}
            </h2>
            <div className="text-left space-y-5">
              <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500">
                {t.storyP1}
              </p>
              <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500">
                {t.storyP2}
              </p>
              <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500">
                {t.storyP3}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 2.5. Įkūrėja — Džiuljeta Vėbrė */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="max-w-[820px] mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                {t.founder.badge}
              </span>
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
                {t.founder.title}
              </h2>
              <p className="text-[1.1rem] text-brand-gray-500 leading-[1.6] max-w-[640px] mx-auto">
                {t.founder.subtitle}
              </p>
              <p className="text-[0.9rem] text-brand-gray-500 mt-2 italic">
                {t.founder.jobTitle}
              </p>
            </div>

            <div className="space-y-5 text-[1.05rem] leading-[1.8] text-brand-gray-500">
              {t.founder.paragraphs.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="my-10 border-l-4 border-brand-magenta bg-white rounded-r-lg p-7 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
              <ul className="space-y-3">
                {t.founder.manifesto.map((line: string, i: number) => (
                  <li
                    key={i}
                    className="text-[1.05rem] font-semibold text-brand-gray-900 leading-[1.6]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[1.05rem] leading-[1.8] text-brand-gray-500 mb-9">
              {t.founder.closing}
            </p>

            <div className="text-center">
              <Link
                href={`${p}/autorius/dziuljeta-vebre`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-magenta text-white rounded-lg text-[1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {t.founder.ctaLabel} →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Misija — juodas blokas */}
      <section className="py-20 bg-brand-gray-900 text-white">
        <Container>
          <div className="text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
              {t.missionBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              {t.missionTitle}
            </h2>
            <p className="text-[1.1rem] text-white/75 max-w-[640px] mx-auto mb-12 leading-[1.7]">
              {t.missionSubtitle}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[
                { icon: '💪', title: t.missionCard1Title, desc: t.missionCard1Desc },
                { icon: '⚙', title: t.missionCard2Title, desc: t.missionCard2Desc },
                { icon: '🤝', title: t.missionCard3Title, desc: t.missionCard3Desc },
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
              {t.brandsBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
              {t.brandsTitle}
            </h2>
            <p className="text-[1.1rem] text-brand-gray-500">
              {t.brandsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: '🎨',
                name: 'Color SHOCK',
                tagline: t.colorShockTagline,
                features: t.colorShockFeatures,
                cta: { label: `${t.viewDyes} →`, href: `${p}/produktai/dazai`, variant: 'primary' as const },
              },
              {
                icon: '🧴',
                name: 'RosaNera Cosmetic',
                tagline: t.rosaneraTagline,
                features: t.rosaneraFeatures,
                cta: { label: `${c.viewProducts} →`, href: `${p}/produktai/sampunai`, variant: 'outline' as const },
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
                  {brand.features.map((f: string) => (
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
              {t.statsBadge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
              {t.statsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: '50+', label: t.stat1 },
              { number: '180 ml', label: t.stat2 },
              { number: '100+', label: t.stat3 },
              { number: t.stat4Number, label: t.stat4 },
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
            {c.startNow}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
            {c.readyToTry}
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500 mb-9 max-w-[560px] mx-auto leading-[1.7]">
            {c.readyCtaDesc}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`${p}/produktai`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {c.viewProducts} →
            </Link>
            <Link
              href={`${p}/kontaktai`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.1rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
            >
              {c.contactUs}
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
