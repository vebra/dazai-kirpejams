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
  /** Įvestos reikšmės klaidos atveju — React 19 po action'o resetina
   * uncontrolled formą; be šito laukai po klaidos išsivalytų. */
  values?: Record<string, string>
}

function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of ['name', 'email', 'phone', 'subject', 'message']) {
    const v = formData.get(k)
    if (typeof v === 'string' && v) out[k] = v
  }
  return out
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

  if (!name) return { error: errors.nameRequired, values: echoValues(formData) }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: errors.emailInvalid, values: echoValues(formData) }
  }
  if (!message) {
    return { error: errors.messageRequired, values: echoValues(formData) }
  }

  const rl = await checkRateLimit({
    action: 'contact',
    windowSeconds: 3600,
    max: 5,
  })
  if (!rl.allowed) {
    return { error: errors.rateLimited, values: echoValues(formData) }
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
    return { error: errors.contactSendFailed, values: echoValues(formData) }
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
