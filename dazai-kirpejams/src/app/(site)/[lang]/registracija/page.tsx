import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { buildPageMetadata } from '@/lib/seo'
import { RegisterForm } from './RegisterForm'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/registracija'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/registracija',
      title: dict.registerPage.metaTitle,
      description: dict.registerPage.metaDesc,
    }),
    robots: { index: false, follow: true },
  }
}

export default async function RegisterPage({
  params,
}: PageProps<'/[lang]/registracija'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <PageHeader title={dict.registerPage.headerTitle} />
      <Section background="gray">
        <Container size="narrow">
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-2">
                {dict.registerPage.cardTitle}
              </h2>
              <p className="text-sm text-brand-gray-500 max-w-md mx-auto leading-relaxed">
                {dict.registerPage.cardDesc}
              </p>
            </div>

            <RegisterForm lang={lang} dict={dict} />
          </div>
        </Container>
      </Section>
    </>
  )
}
