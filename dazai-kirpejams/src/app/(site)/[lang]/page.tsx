export const revalidate = 60

import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, webPageSchema } from '@/lib/schema'
import { buildCanonicalUrl } from '@/lib/seo'
import { Hero } from '@/components/home/Hero'
import { TrustBar } from '@/components/home/TrustBar'
import { Advantages } from '@/components/home/Advantages'
import { Categories } from '@/components/home/Categories'
import { Comparison } from '@/components/home/Comparison'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { Audience } from '@/components/home/Audience'
import { Testimonials } from '@/components/home/Testimonials'
import { B2BCta } from '@/components/home/B2BCta'
import { Newsletter } from '@/components/home/Newsletter'
import { FinalCta } from '@/components/home/FinalCta'

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <>
      <JsonLd data={webPageSchema(lang)} />
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
      ])} />
      <Hero lang={lang} dict={dict} />
      <TrustBar dict={dict} />
      <Advantages dict={dict} />
      <Categories lang={lang} dict={dict} />
      <Comparison lang={lang} dict={dict} />
      <FeaturedProducts lang={lang} dict={dict} />
      <Audience dict={dict} />
      <Testimonials dict={dict} />
      <B2BCta lang={lang} dict={dict} />
      <Newsletter lang={lang} />
      <FinalCta lang={lang} dict={dict} />
    </>
  )
}
