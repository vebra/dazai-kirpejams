'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'
import { sendEmail, getB2bNotificationEmail } from '@/lib/email/resend'
import {
  buildB2bInquiryAdminEmail,
  buildB2bInquiryCustomerEmail,
} from '@/lib/email/templates'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { checkRateLimit, isHoneypotTriggered } from '@/lib/rate-limit'

export type B2bFormState = {
  error?: string
  success?: boolean
}

const FALLBACK_ADMIN_EMAIL = 'info@dziuljetavebre.lt'

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

export async function submitB2bInquiryAction(
  _prev: B2bFormState,
  formData: FormData
): Promise<B2bFormState> {
  const locale = resolveLang(formData.get('locale'))
  const { errors } = await getDictionary(locale)

  if (isHoneypotTriggered(formData)) {
    return { success: true }
  }

  const salonName = ((formData.get('salon_name') as string) ?? '').trim()
  const contactName = ((formData.get('contact_name') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const address = ((formData.get('address') as string) ?? '').trim()
  const monthlyVolume = ((formData.get('monthly_volume') as string) ?? '').trim()
  const message = ((formData.get('message') as string) ?? '').trim()

  if (!salonName) return { error: errors.salonNameRequired }
  if (!contactName) return { error: errors.contactPersonRequired }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: errors.emailInvalid }
  }

  // B2B griežčiau — kiekvienas pateikimas siunčia 2 Resend email'us,
  // tad 3/h per IP yra saugu.
  const rl = await checkRateLimit({
    action: 'b2b',
    windowSeconds: 3600,
    max: 3,
  })
  if (!rl.allowed) {
    return { error: errors.rateLimited }
  }

  const supabase = await createServerSupabase()

  const { error } = await supabase.from('b2b_inquiries').insert({
    salon_name: salonName,
    contact_name: contactName,
    email,
    phone: phone || '',
    address: address || null,
    monthly_volume: monthlyVolume || null,
    message: message || null,
    locale,
    status: 'new',
  })

  if (error) {
    console.error('[b2b-form] insert error:', error.message)
    return { error: errors.b2bSendFailed }
  }

  // Email notifikacijos — adminui (info@dziuljetavebre.lt) ir patvirtinimas
  // klientui. Email klaidos neturi trukdyti vartotojui pamatyti success
  // ekrano — užklausa jau išsaugota DB'e.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  const createdAtIso = new Date().toISOString()
  const adminEmailAddress = getB2bNotificationEmail() ?? FALLBACK_ADMIN_EMAIL

  try {
    const adminPayload = buildB2bInquiryAdminEmail({
      salonName,
      contactName,
      email,
      phone,
      address: address || null,
      monthlyVolume: monthlyVolume || null,
      message: message || null,
      locale,
      adminUrl: `${siteUrl}/admin/b2b`,
      createdAt: createdAtIso,
    })

    const customerPayload = buildB2bInquiryCustomerEmail({
      contactName,
      salonName,
      siteUrl,
    })

    await Promise.all([
      sendEmail({
        to: adminEmailAddress,
        subject: adminPayload.subject,
        html: adminPayload.html,
        text: adminPayload.text,
        replyTo: email,
      }),
      sendEmail({
        to: email,
        subject: customerPayload.subject,
        html: customerPayload.html,
        text: customerPayload.text,
      }),
    ])
  } catch (emailErr) {
    console.error('[b2b-form] email sending failed (non-blocking):', emailErr)
  }

  return { success: true }
}
