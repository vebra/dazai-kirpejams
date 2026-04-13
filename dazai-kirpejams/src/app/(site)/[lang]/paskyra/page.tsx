import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { buildPageMetadata } from '@/lib/seo'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { getVerificationStatus } from '@/lib/auth/verification'
import { AccountView } from './AccountView'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/paskyra'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return {
    ...buildPageMetadata({
      lang,
      path: '/paskyra',
      title: 'Mano paskyra',
      description: 'Jūsų profesionalo paskyros informacija ir dokumento įkėlimas.',
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

  const status = await getVerificationStatus()

  // Fetch profile data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <>
      <PageHeader title="Mano paskyra" />
      <Section background="gray">
        <Container size="narrow">
          <AccountView
            lang={lang}
            email={user.email ?? ''}
            userId={user.id}
            status={status}
            profile={profile}
          />
        </Container>
      </Section>
    </>
  )
}
