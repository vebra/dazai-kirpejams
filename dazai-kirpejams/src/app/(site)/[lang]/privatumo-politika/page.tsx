import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { LegalContent } from '@/components/ui/LegalContent'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { langPrefix } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/privatumo-politika'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return buildPageMetadata({
    lang,
    path: '/privatumo-politika',
    title: dict.privacyPage.metaTitle,
    description: dict.privacyPage.metaDesc,
  })
}

export default async function PrivacyPage({
  params,
}: PageProps<'/[lang]/privatumo-politika'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
        { name: dict.nav.privacy, url: buildCanonicalUrl(lang, '/privatumo-politika') },
      ])} />
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
          <span className="text-brand-gray-900 font-medium">
            {dict.nav.privacy}
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {dict.common.legalBadge}
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            {dict.nav.privacy}
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            {dict.privacyPage.subtitle}
          </p>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-[820px] mx-auto bg-white rounded-2xl p-8 lg:p-12 border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <LegalContent>
              <div dangerouslySetInnerHTML={{ __html: dict.privacyPage.content }} />
            </LegalContent>
          </div>
        </Container>
      </section>
    </>
  )
}
