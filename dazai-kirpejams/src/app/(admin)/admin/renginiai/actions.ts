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

const EVENTS_BUCKET = 'events'
const MAX_HERO_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_HERO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

function buildHeroImagePath(slug: string, file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  const ext =
    fromName && /^[a-z0-9]{2,5}$/.test(fromName)
      ? fromName
      : file.type === 'image/jpeg'
        ? 'jpg'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : file.type === 'image/avif'
              ? 'avif'
              : 'bin'
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${slug}/${ts}-${rand}.${ext}`
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

export async function uploadEventHeroImageAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai/redaguoti?error=invalid-slug')

  const file = formData.get('hero_image')
  if (!(file instanceof File) || file.size === 0) {
    redirect('/admin/renginiai/redaguoti?error=image-missing')
  }
  if (file.size > MAX_HERO_IMAGE_BYTES) {
    redirect('/admin/renginiai/redaguoti?error=image-too-large')
  }
  if (!ALLOWED_HERO_MIME.has(file.type)) {
    redirect('/admin/renginiai/redaguoti?error=image-format')
  }

  const supabase = createServerClient()
  const path = buildHeroImagePath(slug, file)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(EVENTS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })
  if (uploadError) {
    console.error('[admin/renginiai/actions] hero upload:', uploadError.message)
    redirect('/admin/renginiai/redaguoti?error=image-upload-failed')
  }

  const { data: publicData } = supabase.storage
    .from(EVENTS_BUCKET)
    .getPublicUrl(path)
  const publicUrl = publicData.publicUrl

  // Pasiimame senąjį URL prieš keisdami, kad galėtume nuvalyti orphan failą
  const { data: existing } = await supabase
    .from('events')
    .select('hero_image_url')
    .eq('slug', slug)
    .maybeSingle<{ hero_image_url: string | null }>()

  const { error: updateError } = await supabase
    .from('events')
    .update({ hero_image_url: publicUrl })
    .eq('slug', slug)

  if (updateError) {
    console.error('[admin/renginiai/actions] hero update:', updateError.message)
    // Naują failą išvalom, kad neliktų orphan'o
    await supabase.storage.from(EVENTS_BUCKET).remove([path])
    redirect('/admin/renginiai/redaguoti?error=update-failed')
  }

  // Senąją nuotrauką (jei iš mūsų bucket'o) trinam — orphan cleanup
  const prevUrl = existing?.hero_image_url
  if (prevUrl) {
    const marker = `/storage/v1/object/public/${EVENTS_BUCKET}/`
    const idx = prevUrl.indexOf(marker)
    if (idx !== -1) {
      const prevPath = prevUrl.slice(idx + marker.length)
      if (prevPath && prevPath !== path) {
        await supabase.storage.from(EVENTS_BUCKET).remove([prevPath])
      }
    }
  }

  updateTag(ACTIVE_EVENT_TAG)
  revalidatePath('/admin/renginiai')
  revalidatePath('/admin/renginiai/redaguoti')
  revalidatePath('/', 'layout')
  revalidatePath('/renginys')

  redirect('/admin/renginiai/redaguoti?saved=image')
}

export async function removeEventHeroImageAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai/redaguoti?error=invalid-slug')

  const supabase = createServerClient()
  const { data: existing } = await supabase
    .from('events')
    .select('hero_image_url')
    .eq('slug', slug)
    .maybeSingle<{ hero_image_url: string | null }>()

  const { error } = await supabase
    .from('events')
    .update({ hero_image_url: null })
    .eq('slug', slug)
  if (error) {
    console.error('[admin/renginiai/actions] hero remove:', error.message)
    redirect('/admin/renginiai/redaguoti?error=update-failed')
  }

  const prevUrl = existing?.hero_image_url
  if (prevUrl) {
    const marker = `/storage/v1/object/public/${EVENTS_BUCKET}/`
    const idx = prevUrl.indexOf(marker)
    if (idx !== -1) {
      const prevPath = prevUrl.slice(idx + marker.length)
      if (prevPath) {
        await supabase.storage.from(EVENTS_BUCKET).remove([prevPath])
      }
    }
  }

  updateTag(ACTIVE_EVENT_TAG)
  revalidatePath('/admin/renginiai')
  revalidatePath('/admin/renginiai/redaguoti')
  revalidatePath('/', 'layout')
  revalidatePath('/renginys')

  redirect('/admin/renginiai/redaguoti?saved=image-removed')
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
