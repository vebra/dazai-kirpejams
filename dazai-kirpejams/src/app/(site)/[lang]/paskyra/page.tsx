import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { buildPageMetadata } from '@/lib/seo'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { getVerificationStatus } from '@/lib/auth/verification'
import { getInvoicesForEmail } from '@/lib/invoices/queries'
import { AccountView } from './AccountView'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/paskyra'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/paskyra',
      title: dict.accountPage.metaTitle,
      description: dict.accountPage.metaDesc,
    }),
    robots: { index: false, follow: false },
  }
}

export default async function AccountPage({
  params,
}: PageProps<'/[lang]/paskyra'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`${langPrefix(lang)}/prisijungimas`)

  const [dict, status, profileResult, invoices] = await Promise.all([
    getDictionary(lang),
    getVerificationStatus(),
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    user.email ? getInvoicesForEmail(user.email) : Promise.resolve([]),
  ])

  return (
    <>
      <PageHeader title={dict.accountPage.headerTitle} />
      <Section background="gray">
        <Container size="narrow">
          <AccountView
            lang={lang}
            email={user.email ?? ''}
            userId={user.id}
            status={status}
            profile={profileResult.data}
            invoices={invoices}
          />
        </Container>
      </Section>
    </>
  )
}
