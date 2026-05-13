'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import {
  ACTIVE_EVENT_TAG,
  vilniusWallToUtc,
} from '@/lib/events/queries'
import { EVENT_VISIBILITY_TAG } from '@/lib/events/visibility'
import { sendEmail } from '@/lib/email/resend'
import {
  buildEventRegistrationCustomerEmail,
  buildEventReminderEmail,
} from '@/lib/events/emails'
import { buildIcsFile } from '@/lib/events/ics'
import { getActiveEvent } from '@/lib/events/queries'
import {
  EVENT_WIDGET_DEFAULTS,
  saveEventWidgetPrefs,
  type EventWidgetKey,
  type EventWidgetPrefs,
} from '@/lib/admin/event-widgets'
import { SITE_URL } from '@/lib/seo'

const VALID_STATUSES = [
  'confirmed',
  'cancelled',
  'attended',
  'no_show',
] as const

export async function updateEventRegistrationStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  const status = (formData.get('status') as string) ?? ''

  if (!id) redirect('/admin/renginiai?error=invalid-id')
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    redirect('/admin/renginiai?error=invalid-status')
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/renginiai/actions] updateStatus:', error.message)
    redirect('/admin/renginiai?error=update-failed')
  }

  revalidatePath('/admin/renginiai')
}

export async function updateRegistrationNotesAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const id = (formData.get('id') as string) ?? ''
  const notes = ((formData.get('notes') as string) ?? '').slice(0, 2000)

  if (!id) return { ok: false, error: 'invalid-id' }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('event_registrations')
    .update({ notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/renginiai/actions] notes:', error.message)
    return { ok: false, error: 'update-failed' }
  }

  revalidatePath('/admin/renginiai')
  return { ok: true }
}

export async function bulkUpdateStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const status = (formData.get('status') as string) ?? ''
  const idsRaw = (formData.get('ids') as string) ?? ''
  const ids = idsRaw.split(',').filter(Boolean)

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    redirect('/admin/renginiai?error=invalid-status')
  }
  if (ids.length === 0) {
    redirect('/admin/renginiai?error=invalid-id')
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    console.error('[admin/renginiai/actions] bulkUpdate:', error.message)
    redirect('/admin/renginiai?error=update-failed')
  }

  revalidatePath('/admin/renginiai')
}

export async function resendConfirmationEmailAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const id = (formData.get('id') as string) ?? ''
  const kind = ((formData.get('kind') as string) ?? 'confirmation').trim()
  if (!id) return { ok: false, error: 'invalid-id' }

  const supabase = createServerClient()
  const { data: reg, error: fetchErr } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !reg) return { ok: false, error: 'not-found' }

  const event = await getActiveEvent()
  const eventUrl = `${SITE_URL}/lt${event.path}`

  try {
    if (kind === 'reminder') {
      const tpl = buildEventReminderEmail({
        event,
        firstName: reg.first_name,
        eventUrl,
      })
      const r = await sendEmail({
        to: reg.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      })
      if (!r.ok) return { ok: false, error: r.reason ?? 'send-failed' }

      await supabase
        .from('event_registrations')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', id)
    } else {
      const icsBuffer = buildIcsFile({
        event,
        registrationId: reg.id,
        attendeeEmail: reg.email,
        attendeeName: `${reg.first_name} ${reg.last_name}`,
        eventUrl,
      })
      const tpl = buildEventRegistrationCustomerEmail({
        event,
        firstName: reg.first_name,
        lastName: reg.last_name,
        email: reg.email,
        phone: reg.phone,
        salonName: reg.salon_name,
        role: reg.role,
        guestsCount: reg.guests_count ?? 0,
        eventUrl,
      })
      const r = await sendEmail({
        to: reg.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        attachments: [
          {
            filename: 'renginys.ics',
            content: icsBuffer,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ],
      })
      if (!r.ok) return { ok: false, error: r.reason ?? 'send-failed' }
    }
  } catch (e) {
    console.error('[admin/renginiai/actions] resend:', e)
    return { ok: false, error: 'exception' }
  }

  revalidatePath('/admin/renginiai')
  return { ok: true }
}

export async function saveWidgetPrefsAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const next: EventWidgetPrefs = { ...EVENT_WIDGET_DEFAULTS }
  for (const key of Object.keys(EVENT_WIDGET_DEFAULTS) as EventWidgetKey[]) {
    next[key] = formData.get(`w_${key}`) === 'on'
  }
  await saveEventWidgetPrefs(next)
  revalidatePath('/admin/renginiai')
}

function trimOrEmpty(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : ''
}

function intOr(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(trimOrEmpty(v))
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

export async function updateEventAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai/redaguoti?error=invalid-slug')

  const title = trimOrEmpty(formData.get('title'))
  const shortTitle = trimOrEmpty(formData.get('short_title'))
  const description = trimOrEmpty(formData.get('description'))
  const startsAtWall = trimOrEmpty(formData.get('starts_at'))
  const endsAtWall = trimOrEmpty(formData.get('ends_at'))
  const venueName = trimOrEmpty(formData.get('venue_name'))
  const venueStreet = trimOrEmpty(formData.get('venue_street'))
  const venueCity = trimOrEmpty(formData.get('venue_city'))
  const venueCountry = trimOrEmpty(formData.get('venue_country')) || 'LT'
  const venuePostalCode = trimOrEmpty(formData.get('venue_postal_code'))
  const presenterName = trimOrEmpty(formData.get('presenter_name'))
  const presenterTitle = trimOrEmpty(formData.get('presenter_title'))
  const isFree = formData.get('is_free') === 'on'
  const capacityMin = intOr(formData.get('capacity_min'), 0)
  const capacityMax = intOr(formData.get('capacity_max'), 0)
  const contactEmail = trimOrEmpty(formData.get('contact_email'))
  const path = trimOrEmpty(formData.get('path')) || '/renginys'

  if (
    !title ||
    !shortTitle ||
    !description ||
    !startsAtWall ||
    !endsAtWall ||
    !venueName ||
    !venueStreet ||
    !venueCity ||
    !presenterName ||
    !presenterTitle ||
    !contactEmail
  ) {
    redirect('/admin/renginiai/redaguoti?error=required-missing')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    redirect('/admin/renginiai/redaguoti?error=invalid-email')
  }
  if (capacityMax < capacityMin) {
    redirect('/admin/renginiai/redaguoti?error=capacity-order')
  }

  const startsAtUtc = vilniusWallToUtc(startsAtWall)
  const endsAtUtc = vilniusWallToUtc(endsAtWall)
  if (endsAtUtc.getTime() <= startsAtUtc.getTime()) {
    redirect('/admin/renginiai/redaguoti?error=date-order')
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('events')
    .upsert(
      {
        slug,
        is_active: true,
        title,
        short_title: shortTitle,
        description,
        starts_at: startsAtUtc.toISOString(),
        ends_at: endsAtUtc.toISOString(),
        venue_name: venueName,
        venue_street: venueStreet,
        venue_city: venueCity,
        venue_country: venueCountry,
        venue_postal_code: venuePostalCode || null,
        presenter_name: presenterName,
        presenter_title: presenterTitle,
        is_free: isFree,
        capacity_min: capacityMin,
        capacity_max: capacityMax,
        contact_email: contactEmail,
        path,
      },
      { onConflict: 'slug' }
    )

  if (error) {
    console.error('[admin/renginiai/actions] updateEvent:', error.message)
    redirect('/admin/renginiai/redaguoti?error=update-failed')
  }

  updateTag(ACTIVE_EVENT_TAG)
  revalidatePath('/admin/renginiai')
  revalidatePath('/', 'layout')
  revalidatePath('/renginys')
  revalidatePath('/sitemap.xml')

  redirect('/admin/renginiai?saved=event')
}

export async function setEventVisibilityAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const visible = formData.get('visible') === 'true'

  const supabase = createServerClient()
  const { error } = await supabase
    .from('shop_settings')
    .upsert(
      { key: 'event_visible', value: visible, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) {
    console.error('[admin/renginiai/actions] setVisibility:', error.message)
    redirect('/admin/renginiai?error=update-failed')
  }

  updateTag(EVENT_VISIBILITY_TAG)
  revalidatePath('/admin/renginiai')
  revalidatePath('/', 'layout')
  revalidatePath('/renginys')
  revalidatePath('/sitemap.xml')
}

export async function deleteEventRegistrationAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/renginiai?error=invalid-id')

  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/renginiai/actions] delete:', error.message)
    redirect('/admin/renginiai?error=delete-failed')
  }

  revalidatePath('/admin/renginiai')
}
