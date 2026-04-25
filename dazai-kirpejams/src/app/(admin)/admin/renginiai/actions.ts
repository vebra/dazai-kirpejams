'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import {
  buildEventRegistrationCustomerEmail,
  buildEventReminderEmail,
} from '@/lib/events/emails'
import { buildIcsFile } from '@/lib/events/ics'
import { DAZU_PREZENTACIJA_2026 } from '@/lib/events/config'
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

  const event = DAZU_PREZENTACIJA_2026
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
