import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { Newsletter } from '@/components/home/Newsletter'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { getBlogPosts } from '@/lib/data/queries'
import { CATEGORY_STYLES, type ArticleCategory } from '@/lib/data/articles'
import { langPrefix } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/blogas'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.blogPage
  return buildPageMetadata({
    lang,
    path: '/blogas',
    title: t.metaTitle,
    description: t.metaDesc,
  })
}

export default async function BlogPage({
  params,
}: PageProps<'/[lang]/blogas'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.blogPage
  const c = dict.common
  const posts = await getBlogPosts(lang)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: c.home, url: buildCanonicalUrl(lang, '/') },
        { name: t.breadcrumb, url: buildCanonicalUrl(lang, '/blogas') },
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
          <span className="text-brand-gray-900 font-medium">{t.breadcrumb}</span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.badge}
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            {t.title}
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            {t.subtitle}
          </p>
        </Container>
      </section>

      {/* Articles grid */}
      <section className="py-20 bg-white">
        <Container>
          {posts.length === 0 ? (
            <div className="text-center py-16 text-brand-gray-500">
              {t.emptyState}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <article
                  key={post.slug}
                  className="group bg-white rounded-xl overflow-hidden border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 hover:border-brand-magenta transition-all flex flex-col"
                >
                  <Link
                    href={`${langPrefix(lang)}/blogas/${post.slug}`}
                    className="relative aspect-[16/10] bg-[linear-gradient(135deg,#f5f5f7_0%,#e8e8ec_100%)] flex items-center justify-center overflow-hidden"
                    aria-label={post.title}
                  >
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        {...(i < 3 && { priority: true })}
                      />
                    ) : (
                      <span
                        className="text-[4rem] text-brand-magenta/30 group-hover:scale-110 transition-transform"
                        aria-hidden
                      >
                        ✏
                      </span>
                    )}
                  </Link>
                  <div className="p-7 flex flex-col flex-1">
                    {post.category && (
                      <span
                        className={`inline-block self-start px-3 py-1 rounded-full text-[0.72rem] font-bold uppercase tracking-wider mb-4 ${
                          CATEGORY_STYLES[post.category as ArticleCategory] ??
                          'bg-brand-gray-50 text-brand-gray-500'
                        }`}
                      >
                        {t.categoryLabels[post.category as keyof typeof t.categoryLabels] ?? post.category}
                      </span>
                    )}
                    <h3 className="text-[1.15rem] font-bold text-brand-gray-900 mb-3 leading-snug group-hover:text-brand-magenta transition-colors">
                      <Link href={`${langPrefix(lang)}/blogas/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-[0.92rem] text-brand-gray-500 leading-[1.6] mb-5 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#E0E0E0]">
                      <time className="text-[0.82rem] text-brand-gray-500">
                        {(post.publishedAt ?? post.createdAt)?.substring(0, 10)}
                      </time>
                      <Link
                        href={`${langPrefix(lang)}/blogas/${post.slug}`}
                        className="text-[0.88rem] font-semibold text-brand-magenta group-hover:translate-x-1 transition-transform"
                      >
                        {t.readMore}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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
          <p className="text-[1.05rem] text-white/75 mb-9 max-w-[620px] mx-auto leading-[1.7]">
            {t.ctaDesc}
          </p>
          <Link
            href={`${langPrefix(lang)}/produktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            {t.ctaCta}
          </Link>
        </Container>
      </section>

      {/* Newsletter */}
      <Newsletter lang={lang} dict={dict.newsletter} />
    </>
  )
}
