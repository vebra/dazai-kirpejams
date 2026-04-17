import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { buildPageMetadata } from '@/lib/seo'
import { LoginForm } from './LoginForm'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/prisijungimas'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return {
    ...buildPageMetadata({
      lang,
      path: '/prisijungimas',
      title: 'Prisijungimas',
      description:
        'Prisijunkite prie savo profesionalo paskyros ir peržiūrėkite produktų kainas.',
    }),
    robots: { index: false, follow: true },
  }
}

export default async function LoginPage({
  params,
}: PageProps<'/[lang]/prisijungimas'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <>
      <PageHeader title="Prisijungimas" />
      <Section background="gray">
        <Container size="narrow">
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-2">
                Profesionalo paskyra
              </h2>
              <p className="text-sm text-brand-gray-500 leading-relaxed">
                Prisijunkite, kad matytumėte kainas ir galėtumėte pirkti.
              </p>
            </div>

            <LoginForm lang={lang} />
          </div>
        </Container>
      </Section>
    </>
  )
}
