'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'
import { sendEmail, getB2bNotificationEmail } from '@/lib/email/resend'
import {
  buildB2bInquiryAdminEmail,
  buildB2bInquiryCustomerEmail,
} from '@/lib/email/templates'

export type B2bFormState = {
  error?: string
  success?: boolean
}

const FALLBACK_ADMIN_EMAIL = 'info@dziuljetavebre.lt'

export async function submitB2bInquiryAction(
  _prev: B2bFormState,
  formData: FormData
): Promise<B2bFormState> {
  const salonName = ((formData.get('salon_name') as string) ?? '').trim()
  const contactName = ((formData.get('contact_name') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const address = ((formData.get('address') as string) ?? '').trim()
  const monthlyVolume = ((formData.get('monthly_volume') as string) ?? '').trim()
  const message = ((formData.get('message') as string) ?? '').trim()
  const locale = ((formData.get('locale') as string) ?? 'lt').trim()

  if (!salonName) return { error: 'Įveskite salono pavadinimą.' }
  if (!contactName) return { error: 'Įveskite kontaktinį asmenį.' }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Įveskite teisingą el. paštą.' }
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
    return { error: 'Nepavyko išsiųsti užklausos. Bandykite dar kartą.' }
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
