'use server'

import { randomUUID } from 'node:crypto'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { checkRateLimit, isHoneypotTriggered } from '@/lib/rate-limit'
import { sendMetaCapiEvent } from '@/lib/analytics-capi'

export type ContactFormState = {
  error?: string
  success?: boolean
  /** Naudojamas Pixel↔CAPI dedupe (žr. salonams/actions.ts). */
  eventId?: string
}

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const locale = resolveLang(formData.get('locale'))
  const { errors } = await getDictionary(locale)

  if (isHoneypotTriggered(formData)) {
    return { success: true }
  }

  const name = ((formData.get('name') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const subject = ((formData.get('subject') as string) ?? '').trim()
  const message = ((formData.get('message') as string) ?? '').trim()

  if (!name) return { error: errors.nameRequired }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: errors.emailInvalid }
  }
  if (!message) return { error: errors.messageRequired }

  const rl = await checkRateLimit({
    action: 'contact',
    windowSeconds: 3600,
    max: 5,
  })
  if (!rl.allowed) {
    return { error: errors.rateLimited }
  }

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
    return { error: errors.contactSendFailed }
  }

  const eventId = randomUUID()
  // Vardą skaidom į first/last, kad CAPI match quality būtų aukštesnis.
  const [firstName, ...rest] = name.split(/\s+/)
  const lastName = rest.join(' ') || undefined
  await sendMetaCapiEvent({
    eventName: 'Lead',
    eventId,
    userData: {
      email,
      phone: phone || null,
      firstName: firstName || null,
      lastName: lastName ?? null,
      country: 'lt',
    },
    customData: {
      lead_type: 'contact',
      locale,
      content_name: subject || undefined,
    },
  })

  return { success: true, eventId }
}
