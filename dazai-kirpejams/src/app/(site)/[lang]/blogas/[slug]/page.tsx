import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { Newsletter } from '@/components/home/Newsletter'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/data/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { blogPostingSchema, breadcrumbSchema } from '@/lib/schema'
import { CATEGORY_STYLES, type ArticleCategory } from '@/lib/data/articles'
import { langPrefix } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/blogas/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(lang)) return {}

  const post = await getBlogPostBySlug(slug, lang)
  if (!post) return {}

  return buildPageMetadata({
    lang,
    path: `/blogas/${slug}`,
    title: `${post.title} | Dažai Kirpėjams blogas`,
    description: post.excerpt ?? '',
  })
}

export default async function ArticlePage({
  params,
}: PageProps<'/[lang]/blogas/[slug]'>) {
  const { lang, slug } = await params
  if (!hasLocale(lang)) notFound()

  const [post, dict] = await Promise.all([
    getBlogPostBySlug(slug, lang),
    getDictionary(lang),
  ])
  if (!post) notFound()

  const t = dict.blogPost
  const catLabels = dict.blogPage.categoryLabels as Record<string, string>

  // Related: other posts from same category, then any other
  const allPosts = await getBlogPosts(lang)
  const related = allPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      // Same category first
      if (a.category === post.category && b.category !== post.category)
        return -1
      if (b.category === post.category && a.category !== post.category)
        return 1
      return 0
    })
    .slice(0, 2)

  const postUrl = `${SITE_URL}/${lang}/blogas/${slug}`

  return (
    <>
      <JsonLd
        data={blogPostingSchema({
          title: post.title,
          description: post.excerpt ?? '',
          url: postUrl,
          imageUrl: post.coverImageUrl,
          datePublished: post.publishedAt ?? post.createdAt,
          author: post.author,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.common.home, url: `${SITE_URL}/${lang}` },
          { name: dict.blogPage.breadcrumb, url: `${SITE_URL}/${lang}/blogas` },
          { name: post.title, url: postUrl },
        ])}
      />

      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.common.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <Link
            href={`${langPrefix(lang)}/blogas`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.blogPage.breadcrumb}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">{post.title}</span>
        </Container>
      </section>

      {/* Article hero */}
      <section className="py-12 lg:py-16 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="max-w-[820px] mx-auto text-center">
            {post.category && (
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-[0.72rem] font-bold uppercase tracking-wider mb-5 ${
                  CATEGORY_STYLES[post.category as ArticleCategory] ??
                  'bg-brand-gray-50 text-brand-gray-500'
                }`}
              >
                {catLabels[post.category] ?? post.category}
              </span>
            )}
            <h1 className="text-[clamp(1.85rem,4.5vw,2.85rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
              {post.title}
            </h1>
            {post.publishedAt && (
              <div className="text-[0.9rem] text-brand-gray-500">
                <time>{post.publishedAt.substring(0, 10)}</time>
                {post.author && (
                  <>
                    <span
                      className="inline-block w-1 h-1 rounded-full bg-[#D0D0D0] mx-3 align-middle"
                      aria-hidden
                    />
                    <span>{post.author}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Cover image */}
      {post.coverImageUrl && (
        <section className="bg-white">
          <Container>
            <div className="max-w-[820px] mx-auto -mt-4 mb-4">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 820px) 100vw, 820px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Article body */}
      <section className="py-12 lg:py-16 bg-white">
        <Container>
          <div className="max-w-[760px] mx-auto">
            {post.content ? (
              <div
                className="prose prose-lg prose-brand max-w-none
                  [&_h2]:text-[1.6rem] [&_h2]:lg:text-[1.85rem] [&_h2]:font-bold [&_h2]:text-brand-gray-900 [&_h2]:mt-10 [&_h2]:mb-5
                  [&_h3]:text-[1.2rem] [&_h3]:lg:text-[1.35rem] [&_h3]:font-bold [&_h3]:text-brand-gray-900 [&_h3]:mt-8 [&_h3]:mb-4
                  [&_p]:text-[1.05rem] [&_p]:leading-[1.85] [&_p]:text-brand-gray-700 [&_p]:mb-6
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:space-y-2 [&_li]:text-[1.05rem] [&_li]:leading-[1.8] [&_li]:text-brand-gray-700
                  [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-magenta [&_blockquote]:bg-brand-gray-50 [&_blockquote]:pl-6 [&_blockquote]:pr-5 [&_blockquote]:py-5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                  [&_table]:w-full [&_table]:my-8 [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-[#E0E0E0]
                  [&_th]:px-5 [&_th]:py-4 [&_th]:bg-brand-gray-50 [&_th]:font-semibold [&_th]:text-brand-gray-900 [&_th]:text-left [&_th]:border-b [&_th]:border-[#E0E0E0]
                  [&_td]:px-5 [&_td]:py-4 [&_td]:text-brand-gray-700 [&_td]:border-b [&_td]:border-[#E0E0E0]
                  [&_a]:text-brand-magenta [&_a]:font-semibold [&_a]:hover:underline
                  [&_strong]:text-brand-gray-900"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="text-brand-gray-500">
                {t.contentPending}
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="py-16 bg-brand-gray-50">
          <Container>
            <div className="max-w-[1100px] mx-auto">
              <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-brand-gray-900 mb-8 text-center">
                {t.relatedTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`${langPrefix(lang)}/blogas/${rel.slug}`}
                    className="group block bg-white rounded-xl p-7 border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
                  >
                    {rel.category && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider mb-4 ${
                          CATEGORY_STYLES[rel.category as ArticleCategory] ??
                          'bg-brand-gray-50 text-brand-gray-500'
                        }`}
                      >
                        {catLabels[rel.category] ?? rel.category}
                      </span>
                    )}
                    <h3 className="text-[1.1rem] font-bold text-brand-gray-900 mb-3 leading-snug group-hover:text-brand-magenta transition-colors">
                      {rel.title}
                    </h3>
                    <p className="text-[0.9rem] text-brand-gray-500 leading-[1.6] mb-4 line-clamp-3">
                      {rel.excerpt}
                    </p>
                    <span className="text-[0.85rem] font-semibold text-brand-magenta group-hover:translate-x-1 inline-block transition-transform">
                      {t.readMore}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

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
      <Newsletter lang={lang} />
    </>
  )
}
