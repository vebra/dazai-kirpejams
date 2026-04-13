'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'

export type NewsletterState = {
  error?: string
  success?: boolean
}

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const locale = ((formData.get('locale') as string) ?? 'lt').trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Įveskite teisingą el. paštą.' }
  }

  const supabase = await createServerSupabase()

  const { error } = await supabase.from('newsletter_subscribers').upsert(
    {
      email,
      locale,
      is_active: true,
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: 'email' }
  )

  if (error) {
    console.error('[newsletter] insert error:', error.message)
    return { error: 'Nepavyko užprenumeruoti. Bandykite dar kartą.' }
  }

  return { success: true }
}
