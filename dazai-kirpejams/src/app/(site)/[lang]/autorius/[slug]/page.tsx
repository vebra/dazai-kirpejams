import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { Newsletter } from '@/components/home/Newsletter'
import { buildPageMetadata, buildCanonicalUrl } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, personSchema } from '@/lib/schema'
import { AUTHORS, getAuthorBySlug } from '@/lib/data/authors'
import { getBlogPosts } from '@/lib/data/queries'
import { CATEGORY_STYLES, type ArticleCategory } from '@/lib/data/articles'
import { langPrefix } from '@/lib/utils'

export const revalidate = 300

export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = []
  for (const lang of ['lt', 'en', 'ru'] as const) {
    for (const a of AUTHORS) {
      params.push({ lang, slug: a.slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/autorius/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(lang)) return {}
  const author = getAuthorBySlug(slug)
  if (!author) return {}

  const bio = author.bio[lang]
  const jobTitle = author.jobTitle[lang]
  return buildPageMetadata({
    lang,
    path: `/autorius/${slug}`,
    title: `${author.name} — ${jobTitle} | Dažai Kirpėjams`,
    description: bio.tagline,
  })
}

export default async function AuthorPage({
  params,
}: PageProps<'/[lang]/autorius/[slug]'>) {
  const { lang, slug } = await params
  if (!hasLocale(lang)) notFound()
  const author = getAuthorBySlug(slug)
  if (!author) notFound()

  const dict = await getDictionary(lang)
  const t = dict.authorPage
  const c = dict.common
  const blogDict = dict.blogPage
  const catLabels = blogDict.categoryLabels as Record<string, string>
  const p = langPrefix(lang)
  const bio = author.bio[lang]
  const jobTitle = author.jobTitle[lang]

  const allPosts = await getBlogPosts(lang)
  const authorPosts = allPosts.filter((post) => post.author === author.name)

  const pageUrl = buildCanonicalUrl(lang, `/autorius/${slug}`)

  return (
    <>
      <JsonLd
        data={personSchema({
          url: pageUrl,
          name: author.name,
          jobTitle,
          description: bio.tagline,
          imageUrl: author.imagePath
            ? new URL(author.imagePath, pageUrl).toString()
            : null,
          sameAs: author.sameAs,
          knowsAbout: [
            'Hair coloring',
            'Hairdressing',
            'Image design',
            'Beauty industry training',
          ],
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: c.home, url: buildCanonicalUrl(lang, '/') },
          { name: t.breadcrumb, url: pageUrl },
        ])}
      />

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
          <span className="text-brand-gray-900 font-medium">{author.name}</span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-14 items-start max-w-[1100px] mx-auto">
            {/* Photo */}
            <div className="mx-auto lg:mx-0">
              <div className="relative w-[220px] h-[220px] lg:w-[260px] lg:h-[260px] rounded-full overflow-hidden bg-brand-gray-50 ring-4 ring-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                {author.imagePath ? (
                  <Image
                    src={author.imagePath}
                    alt={author.name}
                    fill
                    sizes="(max-width: 1024px) 220px, 260px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[4rem] font-bold text-brand-magenta/30">
                    {author.name
                      .split(' ')
                      .map((s) => s[0])
                      .join('')}
                  </div>
                )}
              </div>
            </div>
            {/* Intro */}
            <div className="text-center lg:text-left">
              <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                {t.badge}
              </span>
              <h1 className="text-[clamp(1.85rem,4.5vw,2.85rem)] font-bold text-brand-gray-900 mb-3 leading-[1.2]">
                {author.name}
              </h1>
              <p className="text-[1.05rem] text-brand-gray-500 mb-5 font-medium">
                {jobTitle}
              </p>
              <p className="text-[1.1rem] text-brand-gray-700 leading-[1.7] max-w-[640px] mx-auto lg:mx-0">
                {bio.tagline}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Bio + highlights */}
      <section className="py-12 lg:py-16 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-14 max-w-[1100px] mx-auto">
            <article className="space-y-6">
              <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-bold text-brand-gray-900">
                {t.bioTitle}
              </h2>
              {bio.paragraphs.map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-[1.05rem] leading-[1.85] text-brand-gray-700"
                >
                  {paragraph}
                </p>
              ))}
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <div className="bg-brand-gray-50 rounded-xl p-6 border border-[#E8E8E8]">
                <h3 className="text-[0.95rem] font-bold text-brand-gray-900 mb-4 uppercase tracking-wider">
                  {t.highlightsTitle}
                </h3>
                <ul className="space-y-3">
                  {bio.highlights.map((h, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-[0.95rem] text-brand-gray-700 leading-snug"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-brand-magenta flex-shrink-0"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {author.publications.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-[#E8E8E8]">
                  <h3 className="text-[0.95rem] font-bold text-brand-gray-900 mb-4 uppercase tracking-wider">
                    {t.publicationsTitle}
                  </h3>
                  <ul className="space-y-2">
                    {author.publications.map((pub, idx) => (
                      <li
                        key={idx}
                        className="text-[0.95rem] text-brand-gray-700 italic"
                      >
                        „{pub.title}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </section>

      {/* Author's posts */}
      {authorPosts.length > 0 && (
        <section className="py-16 bg-brand-gray-50">
          <Container>
            <div className="max-w-[1100px] mx-auto">
              <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-brand-gray-900">
                  {t.postsTitle}
                </h2>
                <Link
                  href={`${p}/blogas`}
                  className="text-[0.9rem] font-semibold text-brand-magenta hover:underline"
                >
                  {t.allPosts} →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`${p}/blogas/${post.slug}`}
                    className="group block bg-white rounded-xl p-6 border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
                  >
                    {post.category && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider mb-4 ${
                          CATEGORY_STYLES[post.category as ArticleCategory] ??
                          'bg-brand-gray-50 text-brand-gray-500'
                        }`}
                      >
                        {catLabels[post.category] ?? post.category}
                      </span>
                    )}
                    <h3 className="text-[1.05rem] font-bold text-brand-gray-900 mb-3 leading-snug group-hover:text-brand-magenta transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[0.9rem] text-brand-gray-500 leading-[1.6] line-clamp-3">
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Newsletter */}
      <Newsletter lang={lang} dict={dict.newsletter} />
    </>
  )
}
