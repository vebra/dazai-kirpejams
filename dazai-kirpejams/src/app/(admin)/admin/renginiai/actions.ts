'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import {
  ACTIVE_EVENT_TAG,
  getEventBySlug,
  vilniusWallToUtc,
} from '@/lib/events/queries'
import { sendEmail } from '@/lib/email/resend'
import {
  buildEventRegistrationCustomerEmail,
  buildEventReminderEmail,
} from '@/lib/events/emails'
import { buildIcsFile } from '@/lib/events/ics'
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

  // Renginį parenkam pagal registracijos `event_slug`, kad veiktų kelių
  // renginių scenarijui.
  const event = await getEventBySlug(reg.event_slug)
  if (!event) return { ok: false, error: 'event-not-found' }
  const eventUrl = `${SITE_URL}/renginys/${event.slug}`

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

/**
 * Validuoja FormData'oj esantį `hero_image` File'ą. Grąžina:
 *  • { ok: true, file: null } — failas neperduotas (skip upload'ą)
 *  • { ok: true, file: File } — failas validus, galima įkelti
 *  • { ok: false, errorParam } — validacijos klaida
 */
function readHeroImageFile(formData: FormData):
  | { ok: true; file: File | null }
  | { ok: false; errorParam: string } {
  const raw = formData.get('hero_image')
  if (!(raw instanceof File) || raw.size === 0) {
    return { ok: true, file: null }
  }
  if (raw.size > MAX_HERO_IMAGE_BYTES) {
    return { ok: false, errorParam: 'image-too-large' }
  }
  if (!ALLOWED_HERO_MIME.has(raw.type)) {
    return { ok: false, errorParam: 'image-format' }
  }
  return { ok: true, file: raw }
}

/**
 * Įkelia hero nuotrauką į `events` bucket'ą. Grąžina viešą URL'ą arba null
 * (jei upload'o klaida). Caller'is atsako už row'o UPDATE'ą su URL'u.
 */
async function uploadHeroImageBuffer(
  supabase: ReturnType<typeof createServerClient>,
  slug: string,
  file: File,
): Promise<{ ok: true; url: string; path: string } | { ok: false }> {
  const path = buildHeroImagePath(slug, file)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabase.storage
    .from(EVENTS_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (uploadError) {
    console.error('[admin/renginiai/actions] upload:', uploadError.message)
    return { ok: false }
  }
  const { data: publicData } = supabase.storage
    .from(EVENTS_BUCKET)
    .getPublicUrl(path)
  return { ok: true, url: publicData.publicUrl, path }
}

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

type EventFieldsResult =
  | { ok: true; fields: EventFieldsPayload }
  | { ok: false; errorParam: string }

type EventFieldsPayload = {
  title: string
  short_title: string
  description: string
  starts_at: string
  ends_at: string
  venue_name: string
  venue_street: string
  venue_city: string
  venue_country: string
  venue_postal_code: string | null
  presenter_name: string
  presenter_title: string
  is_free: boolean
  capacity_min: number
  capacity_max: number
  contact_email: string
}

/**
 * Iš FormData ištraukia ir validuoja visus renginio laukus (be slug, be
 * is_active — tie tvarkomi atskirai). Naudoja `createEventAction` ir
 * `updateEventAction`.
 */
function parseEventFields(formData: FormData): EventFieldsResult {
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
    return { ok: false, errorParam: 'required-missing' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { ok: false, errorParam: 'invalid-email' }
  }
  if (capacityMax < capacityMin) {
    return { ok: false, errorParam: 'capacity-order' }
  }

  const startsAtUtc = vilniusWallToUtc(startsAtWall)
  const endsAtUtc = vilniusWallToUtc(endsAtWall)
  if (endsAtUtc.getTime() <= startsAtUtc.getTime()) {
    return { ok: false, errorParam: 'date-order' }
  }

  return {
    ok: true,
    fields: {
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
    },
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function revalidateEventRoutes(slug: string): void {
  updateTag(ACTIVE_EVENT_TAG)
  revalidatePath('/admin/renginiai')
  revalidatePath('/admin/renginiai/[slug]', 'page')
  revalidatePath('/admin/renginiai/[slug]/redaguoti', 'page')
  revalidatePath('/', 'layout')
  revalidatePath('/renginys')
  revalidatePath(`/renginys/${slug}`)
  revalidatePath('/sitemap.xml')
}

export async function updateEventAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai?error=invalid-slug')

  const parsed = parseEventFields(formData)
  if (!parsed.ok) {
    redirect(
      `/admin/renginiai/${encodeURIComponent(slug)}/redaguoti?error=${parsed.errorParam}`
    )
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('events')
    .update(parsed.fields)
    .eq('slug', slug)

  if (error) {
    console.error('[admin/renginiai/actions] updateEvent:', error.message)
    redirect(
      `/admin/renginiai/${encodeURIComponent(slug)}/redaguoti?error=update-failed`
    )
  }

  revalidateEventRoutes(slug)
  redirect(`/admin/renginiai/${encodeURIComponent(slug)}/redaguoti?saved=event`)
}

export async function createEventAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  // Slug'ą galima įvesti rankiniu būdu arba palikti tuščią — tada
  // automatiškai generuojamas iš pavadinimo.
  let slug = trimOrEmpty(formData.get('slug'))
  const title = trimOrEmpty(formData.get('title'))
  if (!slug && title) slug = slugify(title)
  if (!slug) redirect('/admin/renginiai/naujas?error=invalid-slug')

  const parsed = parseEventFields(formData)
  if (!parsed.ok) {
    redirect(`/admin/renginiai/naujas?error=${parsed.errorParam}`)
  }

  // Hero nuotrauka — nebūtina. Validuojam dabar, kad neinsertintume
  // event'o ir tada nepamiršti, jog failas blogo formato.
  const heroFile = readHeroImageFile(formData)
  if (!heroFile.ok) {
    redirect(`/admin/renginiai/naujas?error=${heroFile.errorParam}`)
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('events').insert({
    slug,
    is_active: false, // Naujas renginys pradeda paslėptas — admin įjungia.
    display_order: 0,
    path: `/renginys/${slug}`,
    ...parsed.fields,
  })

  if (error) {
    if (error.code === '23505') {
      redirect('/admin/renginiai/naujas?error=slug-taken')
    }
    console.error('[admin/renginiai/actions] createEvent:', error.message)
    redirect('/admin/renginiai/naujas?error=update-failed')
  }

  // Jei admin'as pridėjo hero nuotrauką — įkeliam į Storage ir UPDATE'inam
  // ką tik sukurtą eilutę. Klaidos upload'e nesusprogdina viso veiksmo —
  // renginys jau sukurtas, admin gali įkelti vėliau per edit puslapį.
  let savedParam = 'created'
  if (heroFile.file) {
    const upload = await uploadHeroImageBuffer(supabase, slug, heroFile.file)
    if (upload.ok) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ hero_image_url: upload.url })
        .eq('slug', slug)
      if (updateError) {
        console.error('[admin/renginiai/actions] hero url save:', updateError.message)
        await supabase.storage.from(EVENTS_BUCKET).remove([upload.path])
        savedParam = 'created-image-failed'
      } else {
        savedParam = 'created-with-image'
      }
    } else {
      savedParam = 'created-image-failed'
    }
  }

  revalidateEventRoutes(slug)
  redirect(`/admin/renginiai/${encodeURIComponent(slug)}/redaguoti?saved=${savedParam}`)
}

export async function deleteEventAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai?error=invalid-slug')

  const supabase = createServerClient()

  // Hero nuotraukos cleanup — jei buvo įkelta į mūsų bucket'ą.
  const { data: existing } = await supabase
    .from('events')
    .select('hero_image_url')
    .eq('slug', slug)
    .maybeSingle<{ hero_image_url: string | null }>()

  const { error } = await supabase.from('events').delete().eq('slug', slug)

  if (error) {
    console.error('[admin/renginiai/actions] deleteEvent:', error.message)
    redirect('/admin/renginiai?error=delete-failed')
  }

  if (existing?.hero_image_url) {
    const marker = `/storage/v1/object/public/${EVENTS_BUCKET}/`
    const idx = existing.hero_image_url.indexOf(marker)
    if (idx !== -1) {
      const path = existing.hero_image_url.slice(idx + marker.length)
      if (path) {
        await supabase.storage.from(EVENTS_BUCKET).remove([path])
      }
    }
  }

  revalidateEventRoutes(slug)
  redirect('/admin/renginiai?saved=deleted')
}

export async function setEventActiveAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai?error=invalid-slug')
  const active = formData.get('active') === 'true'

  const supabase = createServerClient()
  const { error } = await supabase
    .from('events')
    .update({ is_active: active })
    .eq('slug', slug)

  if (error) {
    console.error('[admin/renginiai/actions] setActive:', error.message)
    redirect('/admin/renginiai?error=update-failed')
  }

  revalidateEventRoutes(slug)
  redirect(`/admin/renginiai?saved=${active ? 'activated' : 'deactivated'}`)
}

export async function uploadEventHeroImageAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai?error=invalid-slug')
  const editPath = `/admin/renginiai/${encodeURIComponent(slug)}/redaguoti`

  const file = formData.get('hero_image')
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${editPath}?error=image-missing`)
  }
  if (file.size > MAX_HERO_IMAGE_BYTES) {
    redirect(`${editPath}?error=image-too-large`)
  }
  if (!ALLOWED_HERO_MIME.has(file.type)) {
    redirect(`${editPath}?error=image-format`)
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
    redirect(`${editPath}?error=image-upload-failed`)
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
    redirect(`${editPath}?error=update-failed`)
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

  revalidateEventRoutes(slug)
  redirect(`${editPath}?saved=image`)
}

export async function removeEventHeroImageAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const slug = trimOrEmpty(formData.get('slug'))
  if (!slug) redirect('/admin/renginiai?error=invalid-slug')
  const editPath = `/admin/renginiai/${encodeURIComponent(slug)}/redaguoti`

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
    redirect(`${editPath}?error=update-failed`)
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

  revalidateEventRoutes(slug)
  redirect(`${editPath}?saved=image-removed`)
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
