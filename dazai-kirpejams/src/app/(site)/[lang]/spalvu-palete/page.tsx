import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from '@/i18n/dictionaries'
import { getProductsStatic } from '@/lib/data/queries'
import { Container } from '@/components/ui/Container'
import { PaletteGrid } from '@/components/products/PaletteGrid'
import { CountUp } from '@/components/ui/CountUp'
import { Newsletter } from '@/components/home/Newsletter'
import { buildPageMetadata, buildCanonicalUrl } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { langPrefix } from '@/lib/utils'

// STATINIS / ISR (Fazė 2): paletė rodo tik spalvas+nuorodas (ne kainas), tad
// renderinama statiškai (getProductsStatic, be cookies()).
export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/spalvu-palete'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/spalvu-palete',
    title: dict.colorPalettePage.metaTitle,
    description: dict.colorPalettePage.metaDesc,
  })
}

export default async function ColorPalettePage({
  params,
}: PageProps<'/[lang]/spalvu-palete'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [products, dict] = await Promise.all([
    getProductsStatic({ categorySlug: 'dazai', sortBy: 'number' }),
    getDictionary(lang),
  ])
  // Svečiui kainos nukirptos (0) — tik teigiamos; anon rodom kanoninę 7,90 €.
  const positivePrices = products
    .map((p) => p.price_cents / 100)
    .filter((p) => p > 0)
  const minPrice = positivePrices.length ? Math.min(...positivePrices) : 7.9

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
        { name: dict.nav.colorPalette, url: buildCanonicalUrl(lang, '/spalvu-palete') },
      ])} />
      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="text-[0.85rem] text-brand-gray-500 mb-5">
            <Link
              href={`${langPrefix(lang) || '/'}`}
              className="hover:text-brand-magenta transition-colors"
            >
              {dict.common.home}
            </Link>
            <span className="mx-2 text-[#E0E0E0]">›</span>
            <span className="text-brand-gray-900 font-medium">
              {dict.nav.colorPalette}
            </span>
          </div>

          <div className="text-center max-w-[820px] mx-auto">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
              <span className="text-brand-magenta">{dict.colorPaletteHero.titlePart1}</span>{' '}
              {dict.colorPaletteHero.titlePart2}
            </h1>
            <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] mb-8">
              {dict.colorPaletteHero.heroDescStart} {products.length || '50+'}{' '}
              {dict.colorPaletteHero.heroDescEnd}
            </p>

            <div className="inline-flex items-center flex-wrap justify-center gap-x-6 gap-y-3 px-8 py-4 bg-white rounded-full border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <div className="text-[0.95rem] text-brand-gray-500">
                <span className="text-brand-magenta text-[1.25rem] font-extrabold">
                  <CountUp to={products.length || 50} />
                </span>{' '}
                {dict.colorPaletteHero.statColors}
              </div>
              <span className="text-[#E0E0E0]" aria-hidden>
                |
              </span>
              <div className="text-[0.95rem] text-brand-gray-500">
                <span className="text-brand-magenta text-[1.25rem] font-extrabold">
                  <CountUp to={180} />
                </span>{' '}
                ml
              </div>
              <span className="text-[#E0E0E0]" aria-hidden>
                |
              </span>
              <div className="text-[0.95rem] text-brand-gray-500">
                {dict.colorPaletteHero.statFrom}{' '}
                <span className="text-brand-magenta text-[1.25rem] font-extrabold">
                  <CountUp to={minPrice} decimals={2} prefix="€" />
                </span>
              </div>
            </div>

            {/* Atsisiųsti paletę — išskirtas, labai matomas blokas */}
            <div className="mt-10 mx-auto w-full max-w-[620px]">
              <div className="rounded-2xl border-2 border-brand-magenta/40 bg-white px-6 py-8 lg:px-10 lg:py-9 shadow-[0_12px_44px_rgba(233,30,140,0.20)]">
                <div className="text-[0.78rem] font-bold uppercase tracking-[2px] text-brand-magenta mb-3">
                  Color SHOCK · PDF
                </div>
                <a
                  href="/color-shock-paleta.pdf"
                  download
                  className="inline-flex w-full items-center justify-center gap-3 px-8 py-5 btn-shine bg-brand-gradient text-white rounded-xl text-[1.2rem] lg:text-[1.4rem] font-bold leading-tight hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(233,30,140,0.42)] transition-all"
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="flex-shrink-0"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {dict.colorPaletteHero.downloadPdf}
                </a>
                <p className="mt-4 text-[0.85rem] text-brand-gray-500">
                  {dict.colorPaletteHero.downloadPdfHint}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Search + filters + grid — interaktyvus client komponentas */}
      <section className="py-12 lg:py-16 bg-white">
        <Container>
          <PaletteGrid
            products={products}
            lang={lang}
            labels={{
              searchPlaceholder: dict.colorPalettePage.searchPlaceholder,
              filterAll: dict.colorPalettePage.filterAll,
              filterNatural: dict.colorPalettePage.filterNatural,
              filterWarm: dict.colorPalettePage.filterWarm,
              filterCool: dict.colorPalettePage.filterCool,
              filterLight: dict.colorPalettePage.filterLight,
              filterMedium: dict.colorPalettePage.filterMedium,
              filterDark: dict.colorPalettePage.filterDark,
              familyLight: dict.colorPalettePage.familyLight,
              familyMedium: dict.colorPalettePage.familyMedium,
              familyDark: dict.colorPalettePage.familyDark,
              viewMore: dict.colorPalettePage.viewMore,
              noResults: dict.colorPalettePage.noResults,
            }}
          />
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-16 bg-white">
        <Container>
          <div className="bg-[linear-gradient(135deg,#1a1a1a_0%,#2a2a2a_100%)] rounded-2xl p-10 lg:p-16 text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              {dict.colorPaletteHero.ctaTitle}
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[600px] mx-auto leading-[1.7]">
              {dict.colorPaletteHero.ctaDesc}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`${langPrefix(lang)}/produktai/dazai`}
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] btn-shine bg-brand-gradient text-white rounded-lg text-[1rem] font-semibold hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {dict.colorPaletteHero.ctaBuy} →
              </Link>
              <Link
                href={`${langPrefix(lang)}/salonams`}
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] border-2 border-white/30 text-white rounded-lg text-[1rem] font-semibold hover:bg-white hover:text-brand-gray-900 hover:border-white hover:-translate-y-0.5 transition-all"
              >
                {dict.colorPaletteHero.ctaSalons}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Newsletter — atkurta iš palete.html:156-169 */}
      <Newsletter lang={lang} dict={dict.newsletter} />
    </>
  )
}
