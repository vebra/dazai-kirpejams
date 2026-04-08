import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { CheckoutForm } from '@/components/commerce/CheckoutForm'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/apmokejimas'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/apmokejimas',
      title: dict.checkout.title,
      description: dict.checkout.orderSummary,
    }),
    robots: { index: false, follow: false },
  }
}

export default async function CheckoutPage({
  params,
}: PageProps<'/[lang]/apmokejimas'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <PageHeader title={dict.checkout.title} />
      <Section background="white">
        <Container>
          <CheckoutForm lang={lang} dict={dict} />
        </Container>
      </Section>
    </>
  )
}
