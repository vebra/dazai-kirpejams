// Kainos rodomos tik patvirtintiems profesionalams (server-side vartai
// queries.ts naudoja cookies()), todėl puslapis renderinamas per request.
// DB užklausos vis tiek cache'inamos unstable_cache (60s).
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  breadcrumbSchema,
  organizationAggregateRatingSchema,
  webPageSchema,
} from '@/lib/schema'
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

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  // AggregateRating sudaroma iš realių atsiliepimų, kurie matomi puslapyje.
  // Google reikalauja, kad reitingas atitiktų kontekstą — todėl ima review
  // array iš to paties dict'o, kuris renderinasi <Testimonials> komponente.
  type DictTestimonial = { quote: string; name: string }
  const testimonials = (dict.testimonials.items as DictTestimonial[]) ?? []
  const avg = testimonials.length > 0 ? 5 : 0
  const aggregateRating =
    testimonials.length > 0
      ? organizationAggregateRatingSchema({
          ratingValue: avg,
          reviewCount: testimonials.length,
          reviews: testimonials.map((t) => ({
            author: t.name,
            reviewBody: t.quote,
            rating: 5,
          })),
        })
      : null

  return (
    <>
      <JsonLd data={webPageSchema(lang)} />
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
      ])} />
      {aggregateRating && <JsonLd data={aggregateRating} />}
      <Hero lang={lang} dict={dict} />
      <EventCountdownSection lang={lang} />
      <TrustBar dict={dict} />
      <Advantages dict={dict} />
      <Categories lang={lang} dict={dict} />
      <Comparison lang={lang} dict={dict} />
      <FeaturedProducts lang={lang} dict={dict} />
      <Audience dict={dict} />
      <MiniCalculator lang={lang} dict={dict.miniCalculator} />
      <Testimonials dict={dict} />
      <B2BCta lang={lang} dict={dict} />
      <Newsletter lang={lang} dict={dict.newsletter} />
      <FinalCta lang={lang} dict={dict} />
    </>
  )
}
