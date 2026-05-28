import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { buildPageMetadata } from '@/lib/seo'
import { NewPasswordForm } from './NewPasswordForm'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/naujas-slaptazodis'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/naujas-slaptazodis',
      title: dict.newPasswordPage.metaTitle,
      description: dict.newPasswordPage.metaDesc,
    }),
    robots: { index: false, follow: false },
  }
}

export default async function NewPasswordPage({
  params,
}: PageProps<'/[lang]/naujas-slaptazodis'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <PageHeader title={dict.newPasswordPage.headerTitle} />
      <Section background="gray">
        <Container size="narrow">
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-2">
                {dict.newPasswordPage.cardTitle}
              </h2>
              <p className="text-sm text-brand-gray-500 leading-relaxed">
                {dict.newPasswordPage.cardDesc}
              </p>
            </div>

            <NewPasswordForm
              lang={lang}
              dict={{
                passwordLabel: dict.newPasswordPage.passwordLabel,
                passwordPlaceholder: dict.newPasswordPage.passwordPlaceholder,
                confirmLabel: dict.newPasswordPage.confirmLabel,
                confirmPlaceholder: dict.newPasswordPage.confirmPlaceholder,
                submit: dict.newPasswordPage.submit,
                submitting: dict.newPasswordPage.submitting,
                successRedirect: dict.newPasswordPage.successRedirect,
              }}
              errorDict={{
                missing: dict.newPasswordPage.errorMissing,
                mismatch: dict.newPasswordPage.errorMismatch,
                weak: dict.newPasswordPage.errorWeak,
                noSession: dict.newPasswordPage.errorNoSession,
                generic: dict.newPasswordPage.errorGeneric,
              }}
            />
          </div>
        </Container>
      </Section>
    </>
  )
}
