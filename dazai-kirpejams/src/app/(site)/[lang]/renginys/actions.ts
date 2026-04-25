'use server'

import { randomUUID } from 'node:crypto'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import {
  buildEventRegistrationAdminEmail,
  buildEventRegistrationCustomerEmail,
} from '@/lib/events/emails'
import { buildIcsFile } from '@/lib/events/ics'
import { DAZU_PREZENTACIJA_2026, isEventPast } from '@/lib/events/config'
import { checkRateLimit, isHoneypotTriggered } from '@/lib/rate-limit'
import { sendMetaCapiEvent } from '@/lib/analytics-capi'

export type EventRegistrationState = {
  error?: string
  success?: boolean
  /** Pixel↔CAPI dedupe ID — grąžinamas klientui `trackLead`'ui */
  eventId?: string
}

const FALLBACK_ADMIN_EMAIL = 'info@dziuljetavebre.lt'
const OWNER_NOTIFICATION_EMAIL = 'vebramarius@gmail.com'

const ALLOWED_ROLES = ['kirpejas', 'koloristas', 'savininkas', 'kita'] as const

export async function registerForEventAction(
  _prev: EventRegistrationState,
  formData: FormData
): Promise<EventRegistrationState> {
  const event = DAZU_PREZENTACIJA_2026

  // Renginys įvyko — uždarom formą serveryje (kliento pusėje puslapis
  // irgi neberenderina formos, bet direct POST'ai dar galėtų ateiti).
  if (isEventPast(event)) {
    return { error: 'Registracija į šį renginį jau uždaryta.' }
  }

  if (isHoneypotTriggered(formData)) {
    // Tyliai grąžinam success, kad bot'as nesidomėtų klaidomis
    return { success: true }
  }

  const firstName = ((formData.get('first_name') as string) ?? '').trim()
  const lastName = ((formData.get('last_name') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const salonName = ((formData.get('salon_name') as string) ?? '').trim()
  const roleRaw = ((formData.get('role') as string) ?? '').trim()
  const guestsRaw = ((formData.get('guests_count') as string) ?? '0').trim()

  if (!firstName) return { error: 'Įveskite vardą.' }
  if (!lastName) return { error: 'Įveskite pavardę.' }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Įveskite teisingą el. paštą.' }
  }
  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return { error: 'Įveskite teisingą telefono numerį.' }
  }

  const role = (ALLOWED_ROLES as readonly string[]).includes(roleRaw)
    ? roleRaw
    : null

  // Guests 0–10 (DB'e yra check constraint, bet validuojam ir čia, kad
  // grąžintume švarią klaidą).
  const guestsParsed = Number.parseInt(guestsRaw, 10)
  const guestsCount =
    Number.isFinite(guestsParsed) && guestsParsed >= 0 && guestsParsed <= 10
      ? guestsParsed
      : 0

  // Rate limit — 5 pateikimų per valandą iš to paties IP pakanka (B2B
  // naudoja 3, bet čia mažesnė email'ų apimtis).
  const rl = await checkRateLimit({
    action: 'event-registration',
    windowSeconds: 3600,
    max: 5,
  })
  if (!rl.allowed) {
    return { error: 'Per daug bandymų. Pabandykite vėliau.' }
  }

  // Service role klientas — RLS politika blokuoja anon insert'us
  // (event_registrations yra service-only). Veiksmas vis tiek patikrintas
  // rate-limit'u + honeypot'u + validacija aukščiau.
  const supabase = createServerClient()

  const { data: inserted, error } = await supabase
    .from('event_registrations')
    .insert({
      event_slug: event.slug,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      salon_name: salonName || null,
      role,
      guests_count: guestsCount,
      locale: 'lt',
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (error) {
    // `23505` = unique_violation — tas pats email jau užregistruotas
    if (error.code === '23505') {
      return { error: 'Šis el. paštas jau užregistruotas. Patikrinkite inbox.' }
    }
    console.error('[event-registration] insert error:', error.message)
    return { error: 'Nepavyko išsaugoti registracijos. Bandykite dar kartą.' }
  }

  const registrationId = inserted.id

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  const eventUrl = `${siteUrl}${event.path}`
  const primaryAdminEmail =
    getAdminNotificationEmail() ?? FALLBACK_ADMIN_EMAIL
  const adminRecipients = Array.from(
    new Set(
      [primaryAdminEmail, OWNER_NOTIFICATION_EMAIL].map((e) => e.toLowerCase())
    )
  )

  // Email'ai + ICS. Jei siuntimas sugrius, registracija JAU DB'e —
  // vartotojas mato success ekraną. Admin gali rankiniu būdu persiųsti
  // patvirtinimą iš panelės (ateityje).
  try {
    const icsBuffer = buildIcsFile({
      event,
      registrationId,
      attendeeEmail: email,
      attendeeName: `${firstName} ${lastName}`,
      eventUrl,
    })

    const customerPayload = buildEventRegistrationCustomerEmail({
      event,
      firstName,
      lastName,
      email,
      phone,
      salonName: salonName || null,
      role,
      guestsCount,
      eventUrl,
    })

    const adminPayload = buildEventRegistrationAdminEmail({
      event,
      firstName,
      lastName,
      email,
      phone,
      salonName: salonName || null,
      role,
      guestsCount,
      eventUrl,
      adminUrl: `${siteUrl}/admin/renginiai`,
    })

    await Promise.all([
      sendEmail({
        to: email,
        subject: customerPayload.subject,
        html: customerPayload.html,
        text: customerPayload.text,
        attachments: [
          {
            filename: 'renginys.ics',
            content: icsBuffer,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ],
      }),
      sendEmail({
        to: adminRecipients,
        subject: adminPayload.subject,
        html: adminPayload.html,
        text: adminPayload.text,
        replyTo: email,
      }),
    ])
  } catch (emailErr) {
    console.error('[event-registration] email failed (non-blocking):', emailErr)
  }

  // Meta CAPI: Lead (retargeting audience) + custom EventRegistration
  // (užstatom su rinkodaros ataskaitoms). Abu naudoja tą patį `eventId`
  // iš Lead'o — klientas dedupe'ins Lead per `fbq('track','Lead',...)`.
  // EventRegistration neturi Pixel atitikmens, tad dedupe ten nereikia.
  const eventId = randomUUID()
  await Promise.all([
    sendMetaCapiEvent({
      eventName: 'Lead',
      eventId,
      userData: {
        email,
        phone,
        firstName,
        lastName,
        country: 'lt',
      },
      customData: {
        lead_type: 'event',
        locale: 'lt',
        content_name: event.title,
      },
    }),
    sendMetaCapiEvent({
      eventName: 'EventRegistration',
      eventId: randomUUID(),
      userData: {
        email,
        phone,
        firstName,
        lastName,
        country: 'lt',
      },
      customData: {
        event_slug: event.slug,
        event_name: event.title,
        guests_count: guestsCount,
      },
    }),
  ])

  return { success: true, eventId }
}
