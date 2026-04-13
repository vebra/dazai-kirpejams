'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'

export type B2bFormState = {
  error?: string
  success?: boolean
}

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

  return { success: true }
}
