import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata } from '@/lib/seo'
import { articles, CATEGORY_STYLES } from '@/lib/data/articles'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/blogas'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/blogas',
    title: 'Blogas — profesionalūs patarimai kirpėjams',
    description:
      'Profesionalūs patarimai, dažymo technikos ir naujausių tendencijų apžvalgos — viskas, kas svarbu Jūsų darbui salone.',
  })
}

export default async function BlogPage({
  params,
}: PageProps<'/[lang]/blogas'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`/${lang}`}
            className="hover:text-brand-magenta transition-colors"
          >
            Pradžia
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">Blogas</span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Straipsniai profesionalams
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            Blogas
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            Profesionalūs patarimai, dažymo technikos ir naujausių tendencijų
            apžvalgos — viskas, kas svarbu Jūsų darbui salone.
          </p>
        </Container>
      </section>

      {/* Category filters */}
      <section className="py-6 bg-white border-b border-[#E0E0E0]">
        <Container>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { key: 'visi', label: 'Visi' },
              { key: 'patarimai', label: 'Patarimai' },
              { key: 'produktai', label: 'Produktai' },
              { key: 'tendencijos', label: 'Tendencijos' },
            ].map((filter, i) => (
              <button
                key={filter.key}
                type="button"
                className={`px-6 py-2.5 rounded-full text-[0.9rem] font-semibold border transition-all ${
                  i === 0
                    ? 'bg-brand-magenta text-white border-brand-magenta shadow-[0_4px_16px_rgba(233,30,140,0.3)]'
                    : 'bg-white text-brand-gray-900 border-[#E0E0E0] hover:border-brand-magenta hover:text-brand-magenta'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Articles grid */}
      <section className="py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="group bg-white rounded-xl overflow-hidden border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 hover:border-brand-magenta transition-all flex flex-col"
              >
                {/* Image placeholder */}
                <Link
                  href={`/${lang}/blogas/${article.slug}`}
                  className="relative aspect-[16/10] bg-[linear-gradient(135deg,#f5f5f7_0%,#e8e8ec_100%)] flex items-center justify-center overflow-hidden"
                  aria-label={article.title}
                >
                  <span
                    className="text-[4rem] text-brand-magenta/30 group-hover:scale-110 transition-transform"
                    aria-hidden
                  >
                    {article.icon}
                  </span>
                </Link>
                <div className="p-7 flex flex-col flex-1">
                  <span
                    className={`inline-block self-start px-3 py-1 rounded-full text-[0.72rem] font-bold uppercase tracking-wider mb-4 ${
                      CATEGORY_STYLES[article.category]
                    }`}
                  >
                    {article.categoryLabel}
                  </span>
                  <h3 className="text-[1.15rem] font-bold text-brand-gray-900 mb-3 leading-snug group-hover:text-brand-magenta transition-colors">
                    <Link href={`/${lang}/blogas/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-[0.92rem] text-brand-gray-500 leading-[1.6] mb-5 flex-1">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#E0E0E0]">
                    <time className="text-[0.82rem] text-brand-gray-500">
                      {article.date}
                    </time>
                    <Link
                      href={`/${lang}/blogas/${article.slug}`}
                      className="text-[0.88rem] font-semibold text-brand-magenta group-hover:translate-x-1 transition-transform"
                    >
                      Skaityti daugiau →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA — juodas blokas */}
      <section className="py-20 bg-brand-gray-900 text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
            Profesionalūs produktai
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
            Peržiūrėkite mūsų produktus
          </h2>
          <p className="text-[1.05rem] text-white/75 mb-9 max-w-[620px] mx-auto leading-[1.7]">
            Straipsniai — tai teorija. O Jūsų rankose — profesionalūs įrankiai,
            kurie kalba patys už save. 180 ml Color SHOCK dažai — daugiau
            vertės kiekvienam dažymui.
          </p>
          <Link
            href={`/${lang}/produktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            Peržiūrėti produktus →
          </Link>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-brand-gray-50">
        <Container>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 max-w-[980px] mx-auto">
            <div className="text-center lg:text-left lg:max-w-[440px]">
              <h3 className="text-[1.35rem] font-bold text-brand-gray-900 mb-2 leading-tight">
                Gaukite naujausių straipsnių ir pasiūlymų
              </h3>
              <p className="text-[0.95rem] text-brand-gray-500 leading-[1.6]">
                Prenumeruokite naujienlaiškį ir gaukite profesionalius
                patarimus bei specialius pasiūlymus tiesiai į el. paštą.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[440px]">
              <input
                type="email"
                required
                placeholder="Jūsų el. pašto adresas"
                className="flex-1 px-5 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] placeholder:text-[#B0B0B0] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
              />
              <button
                type="submit"
                className="px-7 py-[14px] bg-brand-magenta text-white rounded-lg text-[0.95rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all whitespace-nowrap"
              >
                Prenumeruoti
              </button>
            </form>
          </div>
        </Container>
      </section>
    </>
  )
}
