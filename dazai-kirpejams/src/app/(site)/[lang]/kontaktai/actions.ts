'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'

export type ContactFormState = {
  error?: string
  success?: boolean
}

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = ((formData.get('name') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const subject = ((formData.get('subject') as string) ?? '').trim()
  const message = ((formData.get('message') as string) ?? '').trim()
  const locale = ((formData.get('locale') as string) ?? 'lt').trim()

  if (!name) return { error: 'Įveskite vardą.' }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Įveskite teisingą el. paštą.' }
  }
  if (!message) return { error: 'Įveskite žinutę.' }

  const supabase = await createServerSupabase()

  const { error } = await supabase.from('contact_messages').insert({
    name,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
    locale,
  })

  if (error) {
    console.error('[contact-form] insert error:', error.message)
    return { error: 'Nepavyko išsiųsti žinutės. Bandykite dar kartą.' }
  }

  return { success: true }
}
