// Kainos rodomos tik patvirtintiems profesionalams (server-side vartai
// queries.ts naudoja cookies()), todėl puslapis renderinamas per request.
// DB užklausos vis tiek cache'inamos unstable_cache (60s).
export const dynamic = 'force-dynamic'

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
import { MiniCalculator } from '@/components/home/MiniCalculator'
import { EventCountdownSection } from '@/components/events/EventCountdownSection'
import { Reveal } from '@/components/ui/Reveal'

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
      <EventCountdownSection lang={lang} />
      <Reveal><TrustBar dict={dict} /></Reveal>
      <Reveal><Advantages dict={dict} /></Reveal>
      <Reveal><Categories lang={lang} dict={dict} /></Reveal>
      <Reveal><Comparison lang={lang} dict={dict} /></Reveal>
      <Reveal><FeaturedProducts lang={lang} dict={dict} /></Reveal>
      <Reveal><Audience dict={dict} /></Reveal>
      <Reveal><MiniCalculator lang={lang} dict={dict.miniCalculator} /></Reveal>
      <Reveal><Testimonials dict={dict} /></Reveal>
      <Reveal><B2BCta lang={lang} dict={dict} /></Reveal>
      <Reveal><Newsletter lang={lang} dict={dict.newsletter} /></Reveal>
      <Reveal><FinalCta lang={lang} dict={dict} /></Reveal>
    </>
  )
}
