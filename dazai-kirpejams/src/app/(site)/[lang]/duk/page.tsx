import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata } from '@/lib/seo'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/duk'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.faqPage
  return buildPageMetadata({
    lang,
    path: '/duk',
    title: t.metaTitle,
    description: t.metaDesc,
  })
}

type FaqItem = {
  q: string
  text?: string
  intro?: string
  list?: string[]
  outro?: string
}

type FaqCategory = {
  icon: string
  title: string
  items: FaqItem[]
}

function FaqAnswer({ item }: { item: FaqItem }) {
  if (item.text) {
    return <p>{item.text}</p>
  }

  return (
    <>
      {item.intro && <p>{item.intro}</p>}
      {item.list && (
        <ul className="list-disc pl-5 mt-2 space-y-1.5">
          {item.list.map((li) => (
            <li key={li}>{li}</li>
          ))}
        </ul>
      )}
      {item.outro && <p className="mt-2">{item.outro}</p>}
    </>
  )
}

export default async function FaqPage({ params }: PageProps<'/[lang]/duk'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.faqPage
  const c = dict.common
  const p = langPrefix(lang)

  const categories: FaqCategory[] = t.categories

  return (
    <>
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
          <span className="text-brand-gray-900 font-medium">{t.breadcrumb}</span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2] max-w-[820px] mx-auto">
            {t.title}{' '}
            <span className="text-brand-magenta">{t.titleHighlight}</span>
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[680px] mx-auto">
            {t.subtitle}
          </p>
        </Container>
      </section>

      {/* FAQ Sections */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-[860px] mx-auto space-y-14">
            {categories.map((cat) => (
              <div key={cat.title}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-magenta/10 text-[1.5rem] flex items-center justify-center flex-shrink-0">
                    <span aria-hidden>{cat.icon}</span>
                  </div>
                  <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-brand-gray-900 leading-tight">
                    {cat.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <details
                      key={item.q}
                      className="group bg-brand-gray-50 rounded-xl border border-transparent hover:border-[#E0E0E0] open:border-brand-magenta open:shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all"
                    >
                      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="text-[1rem] lg:text-[1.05rem] font-semibold text-brand-gray-900 leading-snug">
                          {item.q}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-center flex-shrink-0 text-brand-magenta transition-transform group-open:rotate-180">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </summary>
                      <div className="px-6 pb-6 pt-0 text-[0.95rem] text-brand-gray-500 leading-[1.7]">
                        <FaqAnswer item={item} />
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="bg-brand-gray-900 text-white rounded-2xl p-10 lg:p-14 text-center max-w-[860px] mx-auto">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[560px] mx-auto leading-[1.7]">
              {t.ctaSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:info@dazaikirpejams.lt"
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] bg-brand-magenta text-white rounded-lg text-[1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {t.ctaEmail}
              </a>
              <Link
                href={`${p}/kontaktai`}
                className="inline-flex items-center justify-center gap-2 px-8 py-[14px] border-2 border-white/30 text-white rounded-lg text-[1rem] font-semibold hover:bg-white hover:text-brand-gray-900 hover:border-white hover:-translate-y-0.5 transition-all"
              >
                {t.ctaContact}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
