import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from '@/i18n/dictionaries'
import { getProducts } from '@/lib/data/queries'
import { Container } from '@/components/ui/Container'
import { PaletteGrid } from '@/components/products/PaletteGrid'
import { Newsletter } from '@/components/home/Newsletter'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/spalvu-palete'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/spalvu-palete',
    title: 'Color SHOCK spalvų paletė — 50 profesionalių atspalvių',
    description:
      'Color SHOCK profesionalių plaukų dažų spalvų paletė. 50+ atspalvių 180 ml pakuotėse. Filtruokite pagal šeimą ar ieškokite pagal numerį.',
  })
}

export default async function ColorPalettePage({
  params,
}: PageProps<'/[lang]/spalvu-palete'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [products, dict] = await Promise.all([
    getProducts({ categorySlug: 'dazai', sortBy: 'number' }),
    getDictionary(lang),
  ])
  const minPrice = products.length
    ? Math.min(...products.map((p) => p.price_cents / 100))
    : 7.99

  return (
    <>
      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="text-[0.85rem] text-brand-gray-500 mb-5">
            <Link
              href={`/${lang}`}
              className="hover:text-brand-magenta transition-colors"
            >
              Pradžia
            </Link>
            <span className="mx-2 text-[#E0E0E0]">›</span>
            <span className="text-brand-gray-900 font-medium">
              Spalvų paletė
            </span>
          </div>

          <div className="text-center max-w-[820px] mx-auto">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
              <span className="text-brand-magenta">Color SHOCK</span> spalvų
              paletė
            </h1>
            <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] mb-8">
              Raskite tobulą spalvą iš {products.length || '50+'} profesionalių
              atspalvių. Kiekvienas atspalvis — 180 ml profesionali pakuotė.
            </p>

            <div className="inline-flex items-center flex-wrap justify-center gap-x-6 gap-y-3 px-8 py-4 bg-white rounded-full border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <div className="text-[0.95rem] text-brand-gray-500">
                <span className="text-brand-magenta text-[1.25rem] font-extrabold">
                  {products.length || 50}
                </span>{' '}
                spalvų
              </div>
              <span className="text-[#E0E0E0]" aria-hidden>
                |
              </span>
              <div className="text-[0.95rem] text-brand-gray-500">
                <span className="text-brand-magenta text-[1.25rem] font-extrabold">
                  180
                </span>{' '}
                ml
              </div>
              <span className="text-[#E0E0E0]" aria-hidden>
                |
              </span>
              <div className="text-[0.95rem] text-brand-gray-500">
                Nuo{' '}
                <span className="text-brand-magenta text-[1.25rem] font-extrabold">
                  €{minPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Search + filters + grid — interaktyvus client komponentas */}
      <section className="py-12 lg:py-16 bg-white">
        <Container>
          <PaletteGrid products={products} lang={lang} />
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-16 bg-white">
        <Container>
          <div className="bg-[linear-gradient(135deg,#1a1a1a_0%,#2a2a2a_100%)] rounded-2xl p-10 lg:p-16 text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              Radote savo spalvą?
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[600px] mx-auto leading-[1.7]">
              Užsisakykite profesionalius Color SHOCK dažus su 180 ml talpa ir
              gaukite daugiau vertės kiekvienam dažymui.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/${lang}/produktai/dazai`}
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] bg-brand-magenta text-white rounded-lg text-[1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                Pirkti dabar →
              </Link>
              <Link
                href={`/${lang}/salonams`}
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] border-2 border-white/30 text-white rounded-lg text-[1rem] font-semibold hover:bg-white hover:text-brand-gray-900 hover:border-white hover:-translate-y-0.5 transition-all"
              >
                Pasiūlymas salonams
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Newsletter — atkurta iš palete.html:156-169 */}
      <Newsletter lang={lang} />
    </>
  )
}
