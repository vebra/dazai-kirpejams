import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { locales } from '@/i18n/config'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata } from '@/lib/seo'
import {
  articles,
  getArticleBySlug,
  getRelatedArticles,
  CATEGORY_STYLES,
  type ArticleBlock,
} from '@/lib/data/articles'

export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = []
  for (const lang of locales) {
    for (const article of articles) {
      params.push({ lang, slug: article.slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/blogas/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(lang)) return {}

  const article = getArticleBySlug(slug)
  if (!article) return {}

  return buildPageMetadata({
    lang,
    path: `/blogas/${slug}`,
    title: `${article.title} | Dažai Kirpėjams blogas`,
    description: article.excerpt,
  })
}

function renderBlock(block: ArticleBlock, index: number) {
  switch (block.type) {
    case 'p':
      return (
        <p
          key={index}
          className="text-[1.05rem] leading-[1.85] text-brand-gray-700 mb-6"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )
    case 'h2':
      return (
        <h2
          key={index}
          className="text-[1.6rem] lg:text-[1.85rem] font-bold text-brand-gray-900 mt-10 mb-5 leading-tight"
        >
          {block.text}
        </h2>
      )
    case 'h3':
      return (
        <h3
          key={index}
          className="text-[1.2rem] lg:text-[1.35rem] font-bold text-brand-gray-900 mt-8 mb-4 leading-tight"
        >
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul
          key={index}
          className="list-disc pl-6 mb-6 space-y-2 text-[1.05rem] leading-[1.8] text-brand-gray-700 marker:text-brand-magenta"
        >
          {block.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )
    case 'blockquote':
      return (
        <blockquote
          key={index}
          className="my-8 border-l-4 border-brand-magenta bg-brand-gray-50 pl-6 pr-5 py-5 rounded-r-lg text-[1.05rem] leading-[1.75] text-brand-gray-900 italic"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )
    case 'table':
      return (
        <div
          key={index}
          className="my-8 overflow-x-auto rounded-xl border border-[#E0E0E0]"
        >
          <table className="w-full text-left text-[0.95rem]">
            <thead className="bg-brand-gray-50">
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-5 py-4 font-semibold text-brand-gray-900 border-b border-[#E0E0E0]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[#E0E0E0] last:border-b-0"
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-5 py-4 text-brand-gray-700 align-top"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

export default async function ArticlePage({
  params,
}: PageProps<'/[lang]/blogas/[slug]'>) {
  const { lang, slug } = await params
  if (!hasLocale(lang)) notFound()

  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = getRelatedArticles(article)

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
          <Link
            href={`/${lang}/blogas`}
            className="hover:text-brand-magenta transition-colors"
          >
            Blogas
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">{article.title}</span>
        </Container>
      </section>

      {/* Article hero */}
      <section className="py-12 lg:py-16 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="max-w-[820px] mx-auto text-center">
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-[0.72rem] font-bold uppercase tracking-wider mb-5 ${CATEGORY_STYLES[article.category]}`}
            >
              {article.categoryLabel}
            </span>
            <h1 className="text-[clamp(1.85rem,4.5vw,2.85rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-[0.9rem] text-brand-gray-500">
              <time>{article.date}</time>
              <span
                className="inline-block w-1 h-1 rounded-full bg-[#D0D0D0]"
                aria-hidden
              />
              <span>{article.readingMinutes} min. skaitymo</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Article body */}
      <section className="py-12 lg:py-16 bg-white">
        <Container>
          <div className="max-w-[760px] mx-auto">
            {article.body.map((block, i) => renderBlock(block, i))}
          </div>
        </Container>
      </section>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="py-16 bg-brand-gray-50">
          <Container>
            <div className="max-w-[1100px] mx-auto">
              <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-brand-gray-900 mb-8 text-center">
                Susiję straipsniai
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/${lang}/blogas/${rel.slug}`}
                    className="group block bg-white rounded-xl p-7 border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
                  >
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider mb-4 ${CATEGORY_STYLES[rel.category]}`}
                    >
                      {rel.categoryLabel}
                    </span>
                    <h3 className="text-[1.1rem] font-bold text-brand-gray-900 mb-3 leading-snug group-hover:text-brand-magenta transition-colors">
                      {rel.title}
                    </h3>
                    <p className="text-[0.9rem] text-brand-gray-500 leading-[1.6] mb-4 line-clamp-3">
                      {rel.excerpt}
                    </p>
                    <span className="text-[0.85rem] font-semibold text-brand-magenta group-hover:translate-x-1 inline-block transition-transform">
                      Skaityti daugiau →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-brand-gray-900 text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
            Profesionalūs produktai
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
            Peržiūrėkite mūsų produktus
          </h2>
          <p className="text-[1.05rem] text-white/75 mb-9 max-w-[620px] mx-auto leading-[1.7]">
            Skaičiai kalba patys už save. Išbandykite Color SHOCK 180 ml dažus
            ir įvertinkite skirtumą savo darbe — nuo pirmo dažymo.
          </p>
          <Link
            href={`/${lang}/produktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            Peržiūrėti produktus →
          </Link>
        </Container>
      </section>
    </>
  )
}
