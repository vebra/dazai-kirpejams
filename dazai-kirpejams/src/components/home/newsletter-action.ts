'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { checkRateLimit, isHoneypotTriggered } from '@/lib/rate-limit'

export type NewsletterState = {
  error?: string
  success?: boolean
}

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const locale = resolveLang(formData.get('locale'))
  const { newsletter } = await getDictionary(locale)

  // Honeypot: bot'ams apsimetam sėkme, kad nesidomėtų
  if (isHoneypotTriggered(formData)) {
    return { success: true }
  }

  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: newsletter.errorInvalidEmail }
  }

  const rl = await checkRateLimit({
    action: 'newsletter',
    windowSeconds: 3600,
    max: 10,
  })
  if (!rl.allowed) {
    return { error: newsletter.errorRateLimited }
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
    return { error: newsletter.errorSubscribeFailed }
  }

  return { success: true }
}
