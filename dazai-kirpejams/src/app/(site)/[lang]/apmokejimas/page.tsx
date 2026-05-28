import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { CheckoutForm } from '@/components/commerce/CheckoutForm'
import { buildPageMetadata } from '@/lib/seo'
import { isUserVerified } from '@/lib/auth/verification'
import { getCompanyInfo } from '@/lib/admin/queries'
import { vatRateFromVatCode } from '@/lib/commerce/constants'
import { langPrefix } from '@/lib/utils'
import { createServerSupabase } from '@/lib/supabase/ssr'
import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'

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

  const verified = await isUserVerified()
  if (!verified) redirect(`${langPrefix(lang)}/prisijungimas`)

  const dict = await getDictionary(lang)
  const company = await getCompanyInfo().catch(() => null)
  const vatRate = vatRateFromVatCode(company?.vatCode)

  // Pre-fill iš user_profiles + auth.users — kad nuolatinis klientas
  // neturėtų kasdien įvesti tų pačių laukų. Tylus fallback į tuščia, jei
  // ko nors trūksta (verified guard'as iškart anksčiau jau garantuoja, kad
  // user yra).
  let prefill:
    | {
        firstName?: string
        lastName?: string
        email?: string
        phone?: string
        salonName?: string
        companyCode?: string
        isCompany?: boolean
        deliveryMethod?: 'courier' | 'parcel_locker' | 'pickup'
        deliveryAddress?: string
        deliveryCity?: string
        deliveryPostalCode?: string
      }
    | undefined
  if (isSupabaseServerConfigured) {
    try {
      const ssr = await createServerSupabase()
      const {
        data: { user },
      } = await ssr.auth.getUser()
      if (user) {
        const admin = createServerClient()
        const { data: profile } = await admin
          .from('user_profiles')
          .select(
            'first_name, last_name, phone, salon_name, company_code, last_delivery_data'
          )
          .eq('id', user.id)
          .maybeSingle()
        const lastDelivery = (profile?.last_delivery_data ?? null) as {
          method?: 'courier' | 'parcel_locker' | 'pickup'
          address?: string | null
          city?: string | null
          postalCode?: string | null
          parcelLocker?: string | null
        } | null
        prefill = {
          firstName: profile?.first_name ?? '',
          lastName: profile?.last_name ?? '',
          email: user.email ?? '',
          phone: profile?.phone ?? '',
          salonName: profile?.salon_name ?? '',
          companyCode: profile?.company_code ?? '',
          // Jei buvo užpildytas salono pavadinimas ar įmonės kodas
          // registracijos metu — pažymim „Perku įmonės vardu" iškart.
          isCompany: Boolean(
            (profile?.salon_name && profile.salon_name.trim()) ||
              (profile?.company_code && profile.company_code.trim())
          ),
          deliveryMethod: lastDelivery?.method,
          deliveryAddress: lastDelivery?.address ?? '',
          deliveryCity: lastDelivery?.city ?? '',
          deliveryPostalCode: lastDelivery?.postalCode ?? '',
        }
      }
    } catch (err) {
      console.error('[apmokejimas/page] prefill fetch failed:', err)
    }
  }

  return (
    <>
      <PageHeader title={dict.checkout.title} />
      <Section background="white">
        <Container>
          <CheckoutForm
            lang={lang}
            dict={dict}
            vatRate={vatRate}
            prefill={prefill}
          />
        </Container>
      </Section>
    </>
  )
}
