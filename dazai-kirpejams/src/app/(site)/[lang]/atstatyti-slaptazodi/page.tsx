import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { buildPageMetadata } from '@/lib/seo'
import { ResetRequestForm } from './ResetRequestForm'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/atstatyti-slaptazodi'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/atstatyti-slaptazodi',
      title: dict.resetRequestPage.metaTitle,
      description: dict.resetRequestPage.metaDesc,
    }),
    robots: { index: false, follow: false },
  }
}

export default async function ResetRequestPage({
  params,
}: PageProps<'/[lang]/atstatyti-slaptazodi'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <PageHeader title={dict.resetRequestPage.headerTitle} />
      <Section background="gray">
        <Container size="narrow">
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-2">
                {dict.resetRequestPage.cardTitle}
              </h2>
              <p className="text-sm text-brand-gray-500 leading-relaxed">
                {dict.resetRequestPage.cardDesc}
              </p>
            </div>

            <ResetRequestForm
              lang={lang}
              dict={{
                emailLabel: dict.resetRequestPage.emailLabel,
                emailPlaceholder: dict.resetRequestPage.emailPlaceholder,
                submit: dict.resetRequestPage.submit,
                submitting: dict.resetRequestPage.submitting,
                successTitle: dict.resetRequestPage.successTitle,
                successDesc: dict.resetRequestPage.successDesc,
                backToLogin: dict.resetRequestPage.backToLogin,
              }}
            />
          </div>
        </Container>
      </Section>
    </>
  )
}
